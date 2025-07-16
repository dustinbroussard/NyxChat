package com.nyxchat.app;

import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    Window window = getWindow();

    // Set status bar color from our theme
    window.setStatusBarColor(ContextCompat.getColor(this, R.color.status_bar_color));

    // Clear flags and adjust for keyboard insets
    window.getDecorView().setSystemUiVisibility(0);
    
    // Adjust keyboard handling to remove empty space above keyboard
    getWindow().setSoftInputMode(
        WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN |
        WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE
    );
    
    // If you want dark icons (for light background), uncomment this:
    // window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
  }
}
