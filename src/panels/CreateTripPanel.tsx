import { useState, useMemo, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import {
  Group,
  FormItem,
  Input,
  Button,
  Textarea,
  Div,
  FormLayoutGroup,
  Caption,
  Spacing,
  Text,
  CustomSelect,
  CustomSelectOption,
  NativeSelect,
  Separator,
  DateInput,
  Spinner,
  type CustomSelectRenderOption,
} from '@vkontakte/vkui';
import { Icon24AddCircleOutline } from '@vkontakte/icons';
import type { City, Trip } from '../lib/supabase';
import { createTrip, ensureCity } from '../lib/api';
import { REGIONS, REGION_SHORT, type Region } from '../lib/regions';

type Props = {
  cities: City[];
  onCreated: (trip: Trip) => void;
  onCityAdded: (city: City) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
};

type FormState = {
  from_city: string;
  to_city: string;
  trip_date: string;
  trip_time: string;
  seats: string;
  price: string;
  description: string;
  contact: string;
  author_name: string;
};

const EMPTY_FORM: FormState = {
  from_city: '',
  to_city: '',
  trip_date: '',
  trip_time: '',
  seats: '1',
  price: '',
  description: '',
  contact: '',
  author_name: '',
};

type CityOption = {
  value: string;
  label: string;
  isCustom?: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const TIME_OPTIONS = HOURS.flatMap((h) =>
  MINUTES.map((m) => ({
    value: `${h}:${m}`,
    label: `${h}:${m}`,
  })),
);

function dateToISO(date: Date | null | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const date = new Date(iso + 'T00:00:00');
  return isNaN(date.getTime()) ? undefined : date;
}

export function CreateTripPanel({ cities, onCreated, onCityAdded, onError, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [vkLoading, setVkLoading] = useState(true);
  const [showValidationError, setShowValidationError] = useState(false);

  const [fromRegion, setFromRegion] = useState<Region | ''>('');
  const [toRegion, setToRegion] = useState<Region | ''>('');
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userInfo = await vkBridge.send('VKWebAppGetUserInfo');
        if (cancelled) return;
        const fullName = [userInfo.first_name, userInfo.last_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        setForm((prev) => ({
          ...prev,
          author_name: fullName || prev.author_name,
          contact: userInfo.id ? `https://vk.com/id${userInfo.id}` : prev.contact,
        }));
      } catch {
        // Not running inside VK — user can fill manually
      } finally {
        if (!cancelled) setVkLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fromCityOptions = useMemo<CityOption[]>(() => {
    if (!fromRegion) return [];
    const regionCities = cities
      .filter((c) => c.region === fromRegion)
      .map((c) => ({ value: c.name, label: c.name }));
    const query = fromSearch.trim().toLowerCase();
    const exists = regionCities.some((o) => o.label.toLowerCase() === query);
    if (query && !exists) {
      return [
        { value: fromSearch.trim(), label: fromSearch.trim(), isCustom: true },
        ...regionCities,
      ];
    }
    return regionCities;
  }, [cities, fromRegion, fromSearch]);

  const toCityOptions = useMemo<CityOption[]>(() => {
    if (!toRegion) return [];
    const regionCities = cities
      .filter((c) => c.region === toRegion)
      .map((c) => ({ value: c.name, label: c.name }));
    const query = toSearch.trim().toLowerCase();
    const exists = regionCities.some((o) => o.label.toLowerCase() === query);
    if (query && !exists) {
      return [
        { value: toSearch.trim(), label: toSearch.trim(), isCustom: true },
        ...regionCities,
      ];
    }
    return regionCities;
  }, [cities, toRegion, toSearch]);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setShowValidationError(false);
  };

  const isFormValid = (): boolean => {
    return (
      form.from_city.trim() !== '' &&
      form.to_city.trim() !== '' &&
      form.from_city.trim() !== form.to_city.trim() &&
      form.trip_date !== '' &&
      form.trip_time !== '' &&
      parseInt(form.seats, 10) >= 1 &&
      form.contact.trim() !== '' &&
      form.author_name.trim() !== ''
    );
  };

  const handleFromRegionChange = (value: string) => {
    setFromRegion(value as Region);
    setFromSearch('');
    update('from_city', '');
  };

  const handleToRegionChange = (value: string) => {
    setToRegion(value as Region);
    setToSearch('');
    update('to_city', '');
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.from_city.trim()) newErrors.from_city = 'Укажите город отправления';
    if (!form.to_city.trim()) newErrors.to_city = 'Укажите город назначения';
    if (form.from_city.trim() && form.to_city.trim() && form.from_city.trim() === form.to_city.trim()) {
      newErrors.to_city = 'Города отправления и назначения должны различаться';
    }
    if (!form.trip_date) newErrors.trip_date = 'Выберите дату';
    if (!form.trip_time) newErrors.trip_time = 'Укажите время';
    const seatsNum = parseInt(form.seats, 10);
    if (!seatsNum || seatsNum < 1) newErrors.seats = 'Минимум 1 место';
    if (!form.contact.trim()) newErrors.contact = 'Укажите контакт для связи';
    if (!form.author_name.trim()) newErrors.author_name = 'Представьтесь, пожалуйста';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setShowValidationError(true);
      return;
    }
    setSubmitting(true);
    try {
      const fromCityName = form.from_city.trim();
      const toCityName = form.to_city.trim();

      const [fromCity, toCity] = await Promise.all([
        ensureCity(fromCityName, fromRegion || undefined),
        ensureCity(toCityName, toRegion || undefined),
      ]);

      if (!cities.some((c) => c.name === fromCity.name)) onCityAdded(fromCity);
      if (!cities.some((c) => c.name === toCity.name)) onCityAdded(toCity);

      const trip = await createTrip({
        from_city: fromCityName,
        to_city: toCityName,
        trip_date: form.trip_date,
        trip_time: form.trip_time,
        seats: parseInt(form.seats, 10),
        price: form.price.trim() || null,
        description: form.description.trim() || null,
        contact: form.contact.trim(),
        author_name: form.author_name.trim(),
        trip_type: 'driver',
      });

      setForm((prev) => ({
        ...EMPTY_FORM,
        author_name: prev.author_name,
        contact: prev.contact,
      }));
      setFromRegion('');
      setToRegion('');
      setFromSearch('');
      setToSearch('');
      setShowValidationError(false);
      onSuccess('\u2705 Поездка опубликована!');
      onCreated(trip);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать поездку';
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCityOption = ({ option, ...restProps }: CustomSelectRenderOption<CityOption>) => (
    <CustomSelectOption
      {...restProps}
      before={option.isCustom ? <Icon24AddCircleOutline width={20} height={20} /> : undefined}
      description={option.isCustom ? `Новый город в регионе «${fromRegion ? REGION_SHORT[fromRegion] : ''}»` : undefined}
    />
  );

  const renderToCityOption = ({ option, ...restProps }: CustomSelectRenderOption<CityOption>) => (
    <CustomSelectOption
      {...restProps}
      before={option.isCustom ? <Icon24AddCircleOutline width={20} height={20} /> : undefined}
      description={option.isCustom ? `Новый город в регионе «${toRegion ? REGION_SHORT[toRegion] : ''}»` : undefined}
    />
  );

  return (
    <>
      <Group>
        <Div>
          <Text weight="2" style={{ marginBottom: 4 }}>
            Заполните детали поездки
          </Text>
          <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
            Сначала выберите регион, затем город. Если города нет в списке — введите его, и он сохранится в выбранном регионе.
          </Caption>
        </Div>
      </Group>

      <Group>
        <FormItem top="Регион отправления">
          <NativeSelect
            value={fromRegion}
            onChange={(e) => handleFromRegionChange(e.target.value)}
            placeholder="Выберите регион"
          >
            <option value="" disabled>
              Выберите регион
            </option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </NativeSelect>
        </FormItem>

        <FormItem
          top="Город отправления"
          status={errors.from_city ? 'error' : 'default'}
          bottom={errors.from_city}
        >
          {fromRegion ? (
            <CustomSelect
              value={form.from_city}
              onChange={(e) => update('from_city', e.target.value)}
              onInputChange={(e) => setFromSearch(e.target.value)}
              placeholder="Выберите или введите город"
              searchable
              filterFn={false}
              options={fromCityOptions}
              renderOption={renderCityOption}
              emptyText="Начните вводить название города"
            />
          ) : (
            <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
              Сначала выберите регион выше
            </Caption>
          )}
        </FormItem>

        <Separator />

        <FormItem top="Регион назначения">
          <NativeSelect
            value={toRegion}
            onChange={(e) => handleToRegionChange(e.target.value)}
            placeholder="Выберите регион"
          >
            <option value="" disabled>
              Выберите регион
            </option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </NativeSelect>
        </FormItem>

        <FormItem
          top="Город назначения"
          status={errors.to_city ? 'error' : 'default'}
          bottom={errors.to_city}
        >
          {toRegion ? (
            <CustomSelect
              value={form.to_city}
              onChange={(e) => update('to_city', e.target.value)}
              onInputChange={(e) => setToSearch(e.target.value)}
              placeholder="Выберите или введите город"
              searchable
              filterFn={false}
              options={toCityOptions}
              renderOption={renderToCityOption}
              emptyText="Начните вводить название города"
            />
          ) : (
            <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
              Сначала выберите регион выше
            </Caption>
          )}
        </FormItem>

        <FormItem
          top="Дата поездки"
          status={errors.trip_date ? 'error' : 'default'}
          bottom={errors.trip_date}
        >
          <DateInput
            value={isoToDate(form.trip_date)}
            onChange={(date) => update('trip_date', dateToISO(date))}
            disablePast
            clearFieldLabel="Очистить дату"
            showCalendarLabel="Открыть календарь"
          />
        </FormItem>

        <FormItem
          top="Время отправления"
          status={errors.trip_time ? 'error' : 'default'}
          bottom={errors.trip_time}
        >
          <CustomSelect
            value={form.trip_time}
            onChange={(e) => update('trip_time', e.target.value)}
            placeholder="Выберите время"
            searchable
            options={TIME_OPTIONS}
            emptyText="Выберите час и минуты"
          />
        </FormItem>

        <FormLayoutGroup mode="horizontal">
          <FormItem
            top="Мест"
            status={errors.seats ? 'error' : 'default'}
            bottom={errors.seats}
          >
            <Input
              type="number"
              min={1}
              max={20}
              value={form.seats}
              onChange={(e) => update('seats', e.target.value)}
            />
          </FormItem>
          <FormItem top="Цена за место (₽)">
            <Input
              type="text"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              placeholder="Напр. 500 или пусто"
            />
          </FormItem>
        </FormLayoutGroup>

        <FormItem top="Комментарий">
          <Textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Маршрут, условия, дополнительные детали…"
            rows={3}
          />
        </FormItem>
      </Group>

      <Group>
        <Div>
          <Text weight="2" style={{ marginBottom: 4 }}>
            Контактные данные
          </Text>
          <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
            Имя и ссылка на профиль подставлены из ВКонтакте автоматически — при
            необходимости их можно изменить.
          </Caption>
        </Div>
        <FormLayoutGroup mode="vertical">
          <FormItem
            top="Ваше имя"
            status={errors.author_name ? 'error' : 'default'}
            bottom={errors.author_name}
          >
            <Input
              value={form.author_name}
              onChange={(e) => update('author_name', e.target.value)}
              placeholder="Как к вам обращаться"
              after={vkLoading ? <Spinner size="s" /> : undefined}
            />
          </FormItem>
          <FormItem
            top="Контакт для связи"
            status={errors.contact ? 'error' : 'default'}
            bottom={errors.contact}
          >
            <Input
              value={form.contact}
              onChange={(e) => update('contact', e.target.value)}
              placeholder="Телефон или ссылка на VK"
              after={vkLoading ? <Spinner size="s" /> : undefined}
            />
          </FormItem>
        </FormLayoutGroup>
      </Group>

      <Group>
        <Div>
          {showValidationError && !isFormValid() && (
            <>
              <Caption
                style={{
                  color: 'var(--vkui--color_text_negative)',
                  textAlign: 'center',
                  marginBottom: 8,
                  display: 'block',
                }}
              >
                Заполните все обязательные поля
              </Caption>
              <Spacing size={8} />
            </>
          )}
          <Button
            size="l"
            stretched
            onClick={handleSubmit}
            loading={submitting}
            disabled={!isFormValid()}
            appearance={isFormValid() ? 'primary' : 'secondary'}
          >
            Опубликовать поездку
          </Button>
          <Spacing size={8} />
          <Caption
            level="1"
            style={{ textAlign: 'center', color: 'var(--vkui--color_text_secondary)' }}
          >
            Нажимая «Опубликовать», вы соглашаетесь, что ваши контактные данные
            будут видны другим пользователям
          </Caption>
        </Div>
      </Group>
    </>
  );
}
