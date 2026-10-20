package dev.alexjyong.babbypaint;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenPinning")
public class ScreenPinningPlugin extends Plugin {

    private static final long POLL_MS = 250;
    private static final int DIALOG_GRACE_POLLS = 6;   // time for the system dialog to take focus
    private static final int MAX_POLLS = 240;           // give up after a minute

    private final Handler handler = new Handler(Looper.getMainLooper());

    @SuppressWarnings("deprecation")
    private boolean isPinned() {
        ActivityManager am = (ActivityManager) getActivity().getSystemService(Context.ACTIVITY_SERVICE);
        return am.isInLockTaskMode();
    }

    @PluginMethod
    public void enterPinnedMode(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            getActivity().startLockTask();
            // startLockTask() returns before the user answers the confirmation dialog,
            // so wait for the pinned state, or for focus to return without it (cancelled).
            handler.post(new Runnable() {
                int polls = 0;

                @Override
                public void run() {
                    polls++;
                    boolean pinned = isPinned();
                    boolean cancelled = polls > DIALOG_GRACE_POLLS && getActivity().hasWindowFocus();
                    if (pinned || cancelled || polls >= MAX_POLLS) {
                        JSObject result = new JSObject();
                        result.put("pinned", pinned);
                        call.resolve(result);
                    } else {
                        handler.postDelayed(this, POLL_MS);
                    }
                }
            });
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
