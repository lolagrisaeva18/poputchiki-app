import { useState, useMemo } from 'react';
import {
  Group,
  Header,
  RichCell,
  Avatar,
  Button,
  Placeholder,
  PullToRefresh,
  Text,
  Caption,
  Spacing,
  Div,
  Search,
  Tabs,
  TabsItem,
  HorizontalScroll,
  FixedLayout,
} from '@vkontakte/vkui';
import {
  Icon24CalendarOutline,
  Icon24PlaceOutline,
  Icon24UserOutline,
  Icon24ClockOutline,
  Icon56UsersOutline,
  Icon24Refresh,
  Icon24CarOutline,
} from '@vkontakte/icons';
import type { City, Trip, TripType } from '../lib/supabase';
import { formatRelativeDate, formatTimeAgo, isPast } from '../lib/format';
import { REGIONS, REGION_SHORT, tripMatchesRegion } from '../lib/regions';

type Props = {
  trips: Trip[];
  cities: City[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onTripClick: (trip: Trip) => void;
  tripType: TripType;
};

type Tab = 'all' | (typeof REGIONS)[number];

export function TripsListPanel({ trips, cities, loading, onRefresh, onTripClick, tripType }: Props) {
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const typeFilteredTrips = useMemo(() => {
    return trips.filter((t) => t.trip_type === tripType);
  }, [trips, tripType]);

  const regionFilteredTrips = useMemo(() => {
    if (activeTab === 'all') return typeFilteredTrips;
    return typeFilteredTrips.filter((t) => tripMatchesRegion(t, cities, activeTab));
  }, [typeFilteredTrips, cities, activeTab]);

  const searchFilteredTrips = useMemo(() => {
    if (!search.trim()) return regionFilteredTrips;
    const q = search.trim().toLowerCase();
    return regionFilteredTrips.filter(
      (t) =>
        t.from_city.toLowerCase().includes(q) ||
        t.to_city.toLowerCase().includes(q) ||
        t.author_name.toLowerCase().includes(q),
    );
  }, [regionFilteredTrips, search]);

  const activeTrips = searchFilteredTrips.filter((t) => !isPast(t.trip_date));
  const pastTrips = searchFilteredTrips.filter((t) => isPast(t.trip_date));

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return null;
  }

  const tabLabel = activeTab === 'all' ? '' : ` · ${REGION_SHORT[activeTab]}`;

  return (
    <>
      <FixedLayout vertical="top" filled>
        <Tabs mode="default" selectedId={activeTab} onSelectedIdChange={(id) => setActiveTab(id as Tab)}>
          <HorizontalScroll>
            <TabsItem id="all" selected={activeTab === 'all'}>
              Все
            </TabsItem>
            {REGIONS.map((region) => (
              <TabsItem key={region} id={region} selected={activeTab === region}>
                {REGION_SHORT[region]}
              </TabsItem>
            ))}
          </HorizontalScroll>
        </Tabs>
        <Group separator="hide" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <Search
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по городу или имени"
          />
        </Group>
      </FixedLayout>

      <div style={{ height: 104 }} />

      {searchFilteredTrips.length === 0 && (
        <Group>
          <Placeholder
            icon={<Icon56UsersOutline />}
            title={activeTab === 'all' ? `${tripType === 'driver' ? 'Предложений' : 'Заявок'} пока нет` : `В регионе «${REGION_SHORT[activeTab]}» пока нет ${tripType === 'driver' ? 'предложений' : 'заявок'}`}
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
            {activeTab === 'all'
              ? `Будьте первым, кто ${tripType === 'driver' ? 'предложит поездку' : 'оставит заявку'}!`
              : 'Попробуйте выбрать другой регион или предложите поездку сами'}
          </Placeholder>
        </Group>
      )}

      {activeTrips.length > 0 && (
        <Group
          header={<Header size="s">Актуальные · {activeTrips.length}{tabLabel}</Header>}
          separator="hide"
        >
          <PullToRefresh onRefresh={handleRefresh} isFetching={refreshing}>
            {activeTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => onTripClick(trip)} />
            ))}
          </PullToRefresh>
        </Group>
      )}

      {pastTrips.length > 0 && (
        <>
          <Spacing size={12} />
          <Group header={<Header size="s">Прошедшие · {pastTrips.length}{tabLabel}</Header>}>
            {pastTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => onTripClick(trip)} faded />
            ))}
          </Group>
        </>
      )}

      <Spacing size={16} />
      <Div>
        <Caption level="3" caps style={{ textAlign: 'center', color: 'var(--vkui--color_text_secondary)' }}>
          Найдите попутчиков в Оренбурге, Челябинске, Екатеринбурге, Уфе, Орске и других городах
        </Caption>
      </Div>
    </>
  );
}

function TripCard({
  trip,
  onClick,
  faded = false,
}: {
  trip: Trip;
  onClick: () => void;
  faded?: boolean;
}) {
  const isDriver = trip.trip_type === 'driver';
  return (
    <RichCell
      onClick={onClick}
      before={
        <Avatar
          size={48}
          style={{
            background: faded
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
      }
      overTitle={
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon24PlaceOutline width={16} height={16} />
            <Text weight="2">{trip.from_city}</Text>
            <span style={{ color: 'var(--vkui--color_text_secondary)' }}>→</span>
            <Text weight="2">{trip.to_city}</Text>
          </span>
        </div>
      }
      subtitle={
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon24CalendarOutline width={16} height={16} />
            <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
              {formatRelativeDate(trip.trip_date)}
            </Caption>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon24ClockOutline width={16} height={16} />
            <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
              {trip.trip_time}
            </Caption>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon24UserOutline width={16} height={16} />
            <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
              {trip.seats} мест
            </Caption>
          </span>
        </div>
      }
      meta={
        trip.price ? (
          <Button mode="primary" size="s" disabled={faded}>
            {trip.price} ₽
          </Button>
        ) : undefined
      }
      bottom={
        <Caption style={{ color: 'var(--vkui--color_text_secondary)' }}>
          {formatTimeAgo(trip.created_at)}
        </Caption>
      }
      multiline
    >
      <Text weight="2">{trip.author_name}</Text>
    </RichCell>
  );
}
