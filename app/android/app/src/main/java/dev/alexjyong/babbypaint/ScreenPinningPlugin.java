package dev.alexjyong.babbypaint;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenPinning")
public class ScreenPinningPlugin extends Plugin {

    @PluginMethod
    public void enterPinnedMode(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().startLockTask();
            call.resolve();
        });
    }

    @PluginMethod
    public void exitPinnedMode(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().stopLockTask();
            call.resolve();
        });
    }
}
