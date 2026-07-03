import { useState } from 'react';
import {
  ModalRoot,
  ModalPage,
  ModalPageHeader,
  Group,
  SimpleCell,
  Text,
  Caption,
  Div,
  Button,
  Spacing,
  Avatar,
  Header,
  Banner,
} from '@vkontakte/vkui';
import {
  Icon24CalendarOutline,
  Icon24ClockOutline,
  Icon24UserOutline,
  Icon24MoneyCircleOutline,
  Icon24MessageOutline,
  Icon24DeleteOutline,
  Icon24PlaceOutline,
  Icon24CarOutline,
} from '@vkontakte/icons';
import type { Trip } from '../lib/supabase';
import { deleteTrip } from '../lib/api';
import { formatDate, formatTimeAgo, isPast } from '../lib/format';

type Props = {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
};

export function TripDetailsModal({ trip, isOpen, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);

  if (!trip) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTrip(trip.id);
      onDeleted(trip.id);
    } catch {
      setDeleting(false);
    }
  };

  const past = isPast(trip.trip_date);
  const isDriver = trip.trip_type === 'driver';

  return (
    <ModalRoot activeModal={isOpen ? 'trip-details' : null} onClose={onClose}>
      <ModalPage id="trip-details" onClose={onClose} header={<ModalPageHeader>{isDriver ? 'Детали поездки' : 'Детали заявки'}</ModalPageHeader>}>
        <Group separator="hide">
          <Div style={{ paddingTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar
                size={56}
                style={{
                  background: past
                    ? 'var(--vkui--color_background_secondary)'
                    : isDriver
                      ? 'linear-gradient(135deg, #4D7BF3 0%, #6B8AF5 100%)'
                      : 'linear-gradient(135deg, #3BB4A0 0%, #4ECDB8 100%)',
                }}
              >
                {isDriver ? (
                  <Icon24CarOutline width={24} height={24} fill="#fff" />
                ) : (
                  <Icon24UserOutline width={24} height={24} fill="#fff" />
                )}
              </Avatar>
              <div>
                <Text weight="2" style={{ fontSize: 18 }}>{trip.author_name}</Text>
                <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
                  {formatTimeAgo(trip.created_at)}
                </Caption>
              </div>
            </div>

            {past && (
              <Banner
                before={<Icon24PlaceOutline width={20} height={20} />}
                title="Поездка уже состоялась"
                subtitle="Информация сохранена для архива"
                mode="tint"
              />
            )}

            <div
              style={{
                background: 'var(--vkui--color_background_secondary)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon24PlaceOutline width={20} height={20} style={{ color: 'var(--vkui--color_icon_secondary)' }} />
                <Text weight="2" style={{ fontSize: 17 }}>{trip.from_city}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 2 }}>
                <div style={{ width: 20, textAlign: 'center', color: 'var(--vkui--color_icon_secondary)' }}>↓</div>
                <Text weight="2" style={{ fontSize: 17 }}>{trip.to_city}</Text>
              </div>
            </div>
          </Div>
        </Group>

        <Group separator="hide" header={<Header size="s">Информация</Header>}>
          <SimpleCell
            before={<Icon24CalendarOutline width={24} height={24} />}
            multiline
          >
            <Text weight="2">{formatDate(trip.trip_date)}</Text>
          </SimpleCell>
          <SimpleCell
            before={<Icon24ClockOutline width={24} height={24} />}
          >
            <Text weight="2">Отправление в {trip.trip_time}</Text>
          </SimpleCell>
          <SimpleCell
            before={<Icon24UserOutline width={24} height={24} />}
          >
            <Text weight="2">{trip.seats} {isDriver ? pluralSeats(trip.seats) : pluralSeatsNeeded(trip.seats)}</Text>
          </SimpleCell>
          {trip.price && (
            <SimpleCell
              before={<Icon24MoneyCircleOutline width={24} height={24} />}
            >
              <Text weight="2">{trip.price} ₽ за место</Text>
            </SimpleCell>
          )}
        </Group>

        {trip.description && (
          <Group header={<Header size="s">Комментарий</Header>}>
            <Div>
              <Text style={{ lineHeight: 1.5 }}>{trip.description}</Text>
            </Div>
          </Group>
        )}

        <Group separator="hide" header={<Header size="s">Связь</Header>}>
          <SimpleCell
            before={<Icon24MessageOutline width={20} height={20} />}
            multiline
          >
            <Text weight="2">{trip.contact}</Text>
          </SimpleCell>
        </Group>

        <Group separator="hide">
          <Div>
            <Button
              size="l"
              stretched
              mode="primary"
              href={getContactLink(trip.contact)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Связаться
            </Button>
            <Spacing size={8} />
            <Button
              size="l"
              stretched
              mode="secondary"
              appearance="negative"
              before={<Icon24DeleteOutline width={20} height={20} />}
              onClick={handleDelete}
              loading={deleting}
            >
              Удалить поездку
            </Button>
          </Div>
        </Group>
        <Spacing size={24} />
      </ModalPage>
    </ModalRoot>
  );
}

function pluralSeats(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'свободное место';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'свободных места';
  return 'свободных мест';
}

function pluralSeatsNeeded(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'место нужно';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'места нужно';
  return 'мест нужно';
}

function getContactLink(contact: string): string {
  const trimmed = contact.trim();
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  if (/^vk\.com\//.test(trimmed)) return `https://${trimmed}`;
  if (/^@/.test(trimmed)) return `https://vk.com/${trimmed.slice(1)}`;
  if (/^\+?\d[\d\s\-()]{6,}$/.test(trimmed)) return `tel:${trimmed.replace(/[^\d+]/g, '')}`;
  return `https://vk.com/${trimmed}`;
}
