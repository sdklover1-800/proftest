import { Redirect, Route, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, personOutline } from 'ionicons/icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './index.css';

/* Feature-Sliced Design Imports */
import { HomePage } from '@features/home';
import { ProfilePage } from '@features/profile';
import { AssessmentPage } from '@features/assessment';
import { ResultsPage } from '@features/results';
import { LoginPage, RegisterPage } from '@features/auth';
import Welcome from './pages/Welcome';
import { useAuthStore } from '@/store/authStore';

setupIonicReact();

// Component that contains the tab bar with conditional visibility
const AuthenticatedApp: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Hide tabs on assessment and results pages for full-screen experience
  const hideTabBar = location.pathname === '/assessment' || location.pathname === '/results';

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/home" component={HomePage} />
        <Route exact path="/profile" component={ProfilePage} />
        <Route exact path="/assessment" component={AssessmentPage} />
        <Route exact path="/results" component={ResultsPage} />
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" style={{ display: hideTabBar ? 'none' : 'flex' }}>
        <IonTabButton tab="home" href="/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>{t('tabs.home')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>{t('tabs.profile')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        <IonReactRouter>
          {isAuthenticated ? <AuthenticatedApp /> : (
            <IonRouterOutlet>
              <Route exact path="/login" component={LoginPage} />
              <Route exact path="/register" component={RegisterPage} />
              <Route exact path="/welcome" component={Welcome} />
              <Route exact path="/">
                <Redirect to="/welcome" />
              </Route>
              <Route>
                <Redirect to="/login" />
              </Route>
            </IonRouterOutlet>
          )}
        </IonReactRouter>
      </IonApp>
    </QueryClientProvider>
  );
};

export default App;
