import { useState, useCallback, useEffect } from 'react';
import vkBridge from '@vkontakte/vk-bridge';
import {
  AppRoot,
  SplitLayout,
  SplitCol,
  Epic,
  Tabbar,
  TabbarItem,
  View,
  Panel,
  PanelHeader,
  Snackbar,
  Avatar,
  ScreenSpinner,
  PanelHeaderBack,
} from '@vkontakte/vkui';
import { Icon28NewsfeedOutline, Icon28AddSquareOutline, Icon28UserCircleOutline } from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';

import type { Trip, City, TripType } from './lib/supabase';
import { fetchTrips, fetchCities } from './lib/api';
import { TripsListPanel } from './panels/TripsListPanel';
import { CreateTripPanel } from './panels/CreateTripPanel';
import { CreatePassengerTripPanel } from './panels/CreatePassengerTripPanel';
import { ProfilePanel } from './panels/ProfilePanel';
import { RoleSelectionPanel, type UserRole } from './panels/RoleSelectionPanel';
import { TripDetailsModal } from './modals/TripDetailsModal';

type SnackbarData = { type: 'success' | 'error'; text: string } | null;

const PANELS = {
  role: 'role',
  feed: 'feed',
  create: 'create',
  profile: 'profile',
} as const;

type ActiveView = keyof typeof PANELS;

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('role');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarData>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [showTripModal, setShowTripModal] = useState(false);

  const showSnackbar = useCallback((type: 'success' | 'error', text: string) => {
    setSnackbar({ type, text });
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsData, citiesData] = await Promise.all([fetchTrips(), fetchCities()]);
      setTrips(tripsData);
      setCities(citiesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки данных';
      showSnackbar('error', message);
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    vkBridge.send('VKWebAppInit').catch(() => {});
    loadAll();
  }, [loadAll]);

  const handleRoleSelect = useCallback((role: UserRole) => {
    setUserRole(role);
    setActiveView('feed');
  }, []);

  const handleSwitchRole = useCallback(() => {
    setActiveView('role');
  }, []);

  const handleTripCreated = useCallback((trip: Trip) => {
    setTrips((prev) => [trip, ...prev]);
    setActiveView('feed');
  }, []);

  const showSuccessSnackbar = useCallback((text: string) => {
    setSnackbar({ type: 'success', text });
    setTimeout(() => setSnackbar(null), 3000);
  }, []);

  const handleTripDeleted = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setShowTripModal(false);
    setActiveTrip(null);
  }, []);

  const handleCityAdded = useCallback((city: City) => {
    setCities((prev) => {
      if (prev.some((c) => c.name === city.name)) return prev;
      return [...prev, city];
    });
  }, []);

  const openTripDetails = useCallback((trip: Trip) => {
    setActiveTrip(trip);
    setShowTripModal(true);
  }, []);

  const currentTripType: TripType = userRole === 'driver' ? 'driver' : 'passenger';

  const getViewTitle = () => {
    if (activeView === 'feed') {
      return userRole === 'driver' ? 'Ищу пассажира' : 'Ищу водителя';
    }
    if (activeView === 'create') {
      return userRole === 'driver' ? 'Предложить поездку' : 'Оставить заявку';
    }
    return 'Профиль';
  };

  return (
    <AppRoot>
      <div className="app-container">
        <SplitLayout
          popout={loading ? <ScreenSpinner state="loading" /> : null}
          modal={
            <TripDetailsModal
              trip={activeTrip}
              isOpen={showTripModal}
              onClose={() => {
                setShowTripModal(false);
                setActiveTrip(null);
              }}
              onDeleted={handleTripDeleted}
            />
          }
        >
          <SplitCol>
            {activeView === 'role' ? (
              <View id="role" activePanel={PANELS.role}>
                <Panel id={PANELS.role}>
                  <PanelHeader>ТыГыДыК</PanelHeader>
                  <RoleSelectionPanel onSelect={handleRoleSelect} />
                </Panel>
              </View>
            ) : (
              <Epic
                activeStory={activeView}
                tabbar={
                  <Tabbar>
                    <TabbarItem
                      selected={activeView === 'feed'}
                      onClick={() => setActiveView('feed')}
                      label={userRole === 'driver' ? 'Пассажиры' : 'Водители'}
                    >
                      <Icon28NewsfeedOutline />
                    </TabbarItem>
                    <TabbarItem
                      selected={activeView === 'create'}
                      onClick={() => setActiveView('create')}
                      label={userRole === 'driver' ? 'Предложить' : 'Заявка'}
                    >
                      <Icon28AddSquareOutline />
                    </TabbarItem>
                    <TabbarItem
                      selected={activeView === 'profile'}
                      onClick={() => setActiveView('profile')}
                      label="Профиль"
                    >
                      <Icon28UserCircleOutline />
                    </TabbarItem>
                  </Tabbar>
                }
              >
                <View id="feed" activePanel={PANELS.feed}>
                  <Panel id={PANELS.feed}>
                    <PanelHeader
                      before={
                        <PanelHeaderBack
                          onClick={handleSwitchRole}
                          label="Роль"
                        />
                      }
                    >
                      {getViewTitle()}
                    </PanelHeader>
                    <TripsListPanel
                      trips={trips}
                      cities={cities}
                      loading={loading}
                      onRefresh={loadAll}
                      onTripClick={openTripDetails}
                      tripType={currentTripType}
                    />
                  </Panel>
                </View>

                <View id="create" activePanel={PANELS.create}>
                  <Panel id={PANELS.create}>
                    <PanelHeader
                      before={
                        <PanelHeaderBack
                          onClick={() => setActiveView('feed')}
                          label="Назад"
                        />
                      }
                    >
                      {getViewTitle()}
                    </PanelHeader>
                    {userRole === 'driver' ? (
                      <CreateTripPanel
                        cities={cities}
                        onCreated={handleTripCreated}
                        onCityAdded={handleCityAdded}
                        onError={(msg) => showSnackbar('error', msg)}
                        onSuccess={showSuccessSnackbar}
                      />
                    ) : (
                      <CreatePassengerTripPanel
                        cities={cities}
                        onCreated={handleTripCreated}
                        onCityAdded={handleCityAdded}
                        onError={(msg) => showSnackbar('error', msg)}
                        onSuccess={showSuccessSnackbar}
                      />
                    )}
                  </Panel>
                </View>

                <View id="profile" activePanel={PANELS.profile}>
                  <Panel id={PANELS.profile}>
                    <PanelHeader>Профиль</PanelHeader>
                    <ProfilePanel trips={trips} onRefresh={loadAll} />
                  </Panel>
                </View>
              </Epic>
            )}
          </SplitCol>

          {snackbar && (
            <Snackbar
              onClose={() => setSnackbar(null)}
              onClosed={() => setSnackbar(null)}
              before={
                <Avatar
                  style={{
                    background:
                      snackbar.type === 'error'
                        ? 'var(--vkui--color_background_negative)'
                        : 'var(--vkui--color_background_positive)',
                  }}
                />
              }
            >
              {snackbar.text}
            </Snackbar>
          )}
        </SplitLayout>
      </div>
    </AppRoot>
  );
}

export default App;
