import { useState, useMemo } from 'react';
import {
  Group,
  Header,
  SimpleCell,
  Avatar,
  Text,
  Caption,
  Div,
  Spacing,
  Placeholder,
  Button,
  PullToRefresh,
  InfoRow,
} from '@vkontakte/vkui';
import {
  Icon56UsersOutline,
  Icon24Refresh,
  Icon24PlaceOutline,
} from '@vkontakte/icons';
import type { Trip } from '../lib/supabase';
import { formatRelativeDate, isPast } from '../lib/format';

type Props = {
  trips: Trip[];
  onRefresh: () => Promise<void>;
};

export function ProfilePanel({ trips, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const active = trips.filter((t) => !isPast(t.trip_date));
    const past = trips.filter((t) => isPast(t.trip_date));
    const citySet = new Set<string>();
    trips.forEach((t) => {
      citySet.add(t.from_city);
      citySet.add(t.to_city);
    });
    return { active, past, totalCities: citySet.size, total: trips.length };
  }, [trips]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <Group>
        <Div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar
            size={72}
            style={{ background: 'linear-gradient(135deg, #4D7BF3 0%, #6B8AF5 100%)' }}
          >
            <Icon24PlaceOutline width={32} height={32} fill="#fff" />
          </Avatar>
          <div>
            <Text weight="2" style={{ fontSize: 20 }}>Попутчики</Text>
            <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
              Поиск попутчиков по России
            </Caption>
          </div>
        </Div>
      </Group>

      <Group header={<Header size="s">Статистика</Header>}>
        <Div>
          <div style={{ display: 'flex', gap: 12 }}>
            <StatCard value={stats.active.length} label="Актуальных" />
            <StatCard value={stats.past.length} label="Прошедших" />
            <StatCard value={stats.totalCities} label="Городов" />
          </div>
        </Div>
      </Group>

      <Group header={<Header size="s">О приложении</Header>}>
        <SimpleCell multiline>
          <Text style={{ lineHeight: 1.5 }}>
            Приложение помогает найти попутчиков для поездок между городами России.
            Предлагайте поездки, ищите компанию и делитесь расходами на дорогу.
          </Text>
        </SimpleCell>
        <SimpleCell>
          <InfoRow header="Города по умолчанию">
            Оренбург, Челябинск, Екатеринбург, Уфа, Орск
          </InfoRow>
        </SimpleCell>
      </Group>

      {stats.total === 0 ? (
        <Group>
          <Placeholder
            icon={<Icon56UsersOutline />}
            title="Пока нет поездок"
            action={
              <Button
                size="m"
                before={<Icon24Refresh />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                Обновить
              </Button>
            }
          >
            Потяните вниз, чтобы обновить список
          </Placeholder>
        </Group>
      ) : (
        <Group
          header={<Header size="s">Все поездки · {stats.total}</Header>}
        >
          <PullToRefresh onRefresh={handleRefresh} isFetching={refreshing}>
            {trips.map((trip) => (
              <SimpleCell
                key={trip.id}
                before={<Icon24PlaceOutline width={20} height={20} />}
                after={
                  <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
                    {formatRelativeDate(trip.trip_date)}
                  </Caption>
                }
                multiline
              >
                <Text weight="2">{trip.from_city} → {trip.to_city}</Text>
                <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
                  {trip.author_name} · {trip.seats} мест
                </Caption>
              </SimpleCell>
            ))}
          </PullToRefresh>
        </Group>
      )}

      <Spacing size={24} />
    </>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--vkui--color_background_secondary)',
        borderRadius: 12,
        padding: '16px 12px',
        textAlign: 'center',
      }}
    >
      <Text weight="2" style={{ fontSize: 28, color: 'var(--vkui--color_text_primary)' }}>
        {value}
      </Text>
      <Caption level="1" style={{ color: 'var(--vkui--color_text_secondary)' }}>
        {label}
      </Caption>
    </div>
  );
}
