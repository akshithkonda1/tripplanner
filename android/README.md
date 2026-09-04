# Trippy for Android

Kotlin + Jetpack Compose. Two modules:

- `:domain` — shared trip models (compiles with JDK only)
- `:app` — Compose UI (needs Android SDK 35)

```bash
./gradlew :domain:test
./gradlew :app:assembleDebug
```

The app launches with sample Road, Flight, and Hybrid trips so you can walk the tabs without an API.
