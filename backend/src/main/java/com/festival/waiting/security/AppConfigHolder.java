package com.festival.waiting.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppConfigHolder {

    public static String serverUrl;

    @Value("${app.server-url:http://localhost:8080}")
    public void setServerUrl(String url) {
        AppConfigHolder.serverUrl = url;
    }
}
