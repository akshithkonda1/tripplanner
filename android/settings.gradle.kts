pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Trippy"
include(":domain")

val localProps = java.util.Properties()
val localFile = file("local.properties")
if (localFile.exists()) {
    localFile.inputStream().use { localProps.load(it) }
}
val hasAndroidSdk = !System.getenv("ANDROID_HOME").isNullOrBlank()
    || !System.getenv("ANDROID_SDK_ROOT").isNullOrBlank()
    || !localProps.getProperty("sdk.dir").isNullOrBlank()
if (hasAndroidSdk) {
    include(":app")
}
