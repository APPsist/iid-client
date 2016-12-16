package de.appsist.service.iid.client;

import org.vertx.java.core.json.JsonObject;

/**
 * Wrapper for the module configuration.
 * @author simon.schwantzer(at)im-c.de
 */
public class ModuleConfiguration {
	private final JsonObject config;
	
	/**
	 * Creates a wrapper for the given configuration object. 
	 * @param config JSON object containing the module configuration. 
	 * @throws IllegalArgumentException The given configuration is not valid.
	 */
	public ModuleConfiguration(JsonObject config) throws IllegalArgumentException {
		if (config == null) {
			throw new IllegalArgumentException("Configuration is but may not be null.");
		}
		validateConfiguration(config);
		this.config = config;
	}
	
	/**
	 * Validate the module configuration.
	 * @param config JSON object to validate.
	 * @throws IllegalArgumentException The JSON object is no valid module configuration. 
	 */
	private void validateConfiguration(JsonObject config) throws IllegalArgumentException {
		JsonObject webserver = config.getObject("webserver");
		if (webserver == null) {
			throw new IllegalArgumentException("Configuration for web server [webserver] is missing.");
		}
	}
	
	/**
	 * Returns the JSON object wrapped.
	 * @return JSON object containing the module configuration.
	 */
	public JsonObject getJson() {
		return config;
    }
	
	/**
	 * Returns the base path for the web server.
	 * @return Web server base path or empty string if not set.
	 */
	public String getWebserverBasePath() {
		String basePath = config.getObject("webserver").getString("basePath");
		return basePath != null ? basePath : "";
	}
	
	/**
	 * Returns the port of the web server.
	 * @return Web server port.
	 */
	public int getWebserverPort() {
		return config.getObject("webserver").getInteger("port");
	}
	
	public JsonObject getStatusSingalConfiguration() {
		return config.getObject("statusSignal");
	}
}
