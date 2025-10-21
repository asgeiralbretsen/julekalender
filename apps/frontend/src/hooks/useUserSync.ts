import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const useUserSync = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user) return;

      console.log('Syncing user:', user.id, 'to API:', API_BASE_URL);

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl
          })
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ User synced to database:', userData);
        } else {
          console.error('❌ Failed to sync user:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        console.error('❌ Error syncing user:', error);
      }
    };

    syncUser();
  }, [isLoaded, user]);

  return { user, isLoaded };
};
