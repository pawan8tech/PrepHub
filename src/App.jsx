import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ModeProvider } from './context/ModeContext';
import { MobileActionsProvider } from './context/MobileActionsContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { ProgressProvider } from './context/ProgressContext';
import { RecentProvider } from './context/RecentContext';
import { DSAProblemProvider } from './context/DSAProblemContext';
import { AuthProvider } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import { CustomTopicsProvider } from './context/CustomTopicsContext';
import { CustomCategoriesProvider } from './context/CustomCategoriesContext';
import { TopicOrderProvider } from './context/TopicOrderContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <CustomCategoriesProvider>
          <CustomTopicsProvider>
            <TopicOrderProvider>
              <ThemeProvider>
                <ModeProvider>
                  <MobileActionsProvider>
                  <BookmarkProvider>
                    <ProgressProvider>
                      <RecentProvider>
                        <DSAProblemProvider>
                          <RouterProvider router={router} />
                        </DSAProblemProvider>
                      </RecentProvider>
                    </ProgressProvider>
                  </BookmarkProvider>
                  </MobileActionsProvider>
                </ModeProvider>
              </ThemeProvider>
            </TopicOrderProvider>
          </CustomTopicsProvider>
        </CustomCategoriesProvider>
      </NotesProvider>
    </AuthProvider>
  );
}
