package com.fairsplit.app;

import android.os.Bundle;
import android.content.Intent;
import android.content.ComponentName;
import android.provider.Settings;
import android.app.AlertDialog;
import android.content.DialogInterface;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static Bridge bridgeInstance;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        bridgeInstance = getBridge();
        
        // Ask for Notifications and SMS popup
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            java.util.List<String> permList = new java.util.ArrayList<>();
            permList.add(android.Manifest.permission.RECEIVE_SMS);
            permList.add(android.Manifest.permission.READ_SMS);
            
            // Post Notifications (Sending)
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                permList.add("android.permission.POST_NOTIFICATIONS");
            }
            
            if (!permList.isEmpty()) {
                requestPermissions(permList.toArray(new String[0]), 123);
            }
        }

        // Special check for Notification Access (Read/Reply/Control)
        if (!isNotificationServiceEnabled()) {
            showRestrictedSettingsDialog();
        }
    }

    private void showRestrictedSettingsDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Important Setup Step")
            .setMessage("Android restricts notification access for apps not installed directly from the Play Store.\n\n" +
                        "If the FairSplit toggle on the next screen is greyed out, please follow these steps:\n\n" +
                        "1. Go to your phone's App Info (Settings > Apps > FairSplit)\n" +
                        "2. Tap the 3 dots (⋮) in the top-right corner\n" +
                        "3. Tap 'Allow restricted settings'\n\n" +
                        "Once allowed, you can enable FairSplit Notification Access to automatically track payments.")
            .setPositiveButton("Go to Settings", new DialogInterface.OnClickListener() {
                public void onClick(DialogInterface dialog, int which) {
                    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                    startActivity(intent);
                }
            })
            .setCancelable(false)
            .show();
    }

    private boolean isNotificationServiceEnabled() {
        String pkgName = getPackageName();
        final String flat = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        if (flat != null && !flat.isEmpty()) {
            final String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && cn.getPackageName().equals(pkgName)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static Bridge getBridgeInstance() {
        return bridgeInstance;
    }
}
