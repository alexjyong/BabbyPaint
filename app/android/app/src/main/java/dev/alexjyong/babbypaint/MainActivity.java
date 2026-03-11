package dev.alexjyong.babbypaint;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ScreenPinningPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
