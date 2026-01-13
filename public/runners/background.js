// Background Runner Script for Health Connect Sync
// This file runs in a headless JavaScript environment, NOT in the browser

addEventListener('syncHealthData', async (resolve, reject, args) => {
  try {
    console.log('[BackgroundRunner] Starting Health Connect sync...');
    
    const supabaseUrl = args.supabaseUrl;
    const supabaseKey = args.supabaseKey;
    const userId = args.userId;
    
    if (!supabaseUrl || !supabaseKey || !userId) {
      console.log('[BackgroundRunner] Missing configuration, skipping sync');
      resolve({ success: false, reason: 'missing_config' });
      return;
    }

    // Check if Health Connect data is available via CapacitorHealthConnect API
    // Note: In background runner, we have limited APIs available
    // We'll use fetch to call an edge function that handles the sync
    
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-health-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        userId: userId,
        timestamp: new Date().toISOString(),
        source: 'background_sync'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[BackgroundRunner] Sync completed:', JSON.stringify(data));
      
      // Show notification about sync completion
      CapacitorNotifications.schedule([
        {
          id: Math.floor(Math.random() * 10000),
          title: '🔄 Datos sincronizados',
          body: 'Tus datos de salud se han actualizado automáticamente',
        },
      ]);
      
      resolve({ success: true, data });
    } else {
      console.log('[BackgroundRunner] Sync failed:', response.status);
      resolve({ success: false, reason: 'api_error', status: response.status });
    }
  } catch (error) {
    console.error('[BackgroundRunner] Error during sync:', error);
    reject(error);
  }
});

addEventListener('checkHealthReminders', async (resolve, reject, args) => {
  try {
    console.log('[BackgroundRunner] Checking health reminders...');
    
    const now = new Date();
    const hour = now.getHours();
    
    // Check if we're in a reminder time window
    const reminderHours = [10, 15, 19, 21, 22]; // Activity, Screen break, Meal, Prepare sleep, Bedtime
    
    if (reminderHours.includes(hour)) {
      // We could check user settings here via an API call
      // For now, we'll let the main app handle the specific notifications
      console.log('[BackgroundRunner] In reminder window, app will handle notifications');
    }
    
    resolve({ checked: true, hour });
  } catch (error) {
    console.error('[BackgroundRunner] Error checking reminders:', error);
    reject(error);
  }
});
