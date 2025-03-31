build:
	npx cap build android --keystorepath ${JQUIZ_RELEASE_STORE_FILE} --keystorepass ${JQUIZ_RELEASE_STORE_PASSWORD} --keystorealias android --keystorealiaspass ${JQUIZ_RELEASE_STORE_PASSWORD} --androidreleasetype APK
