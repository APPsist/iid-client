package de.appsist.service.iid.client;

import java.io.IOException;

import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.HttpServerResponse;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.logging.Logger;
import org.vertx.java.core.logging.impl.LoggerFactory;
import org.vertx.java.platform.Verticle;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Template;
import com.github.jknack.handlebars.io.ClassPathTemplateLoader;
import com.github.jknack.handlebars.io.TemplateLoader;

import de.appsist.commons.misc.StatusSignalConfiguration;
import de.appsist.commons.misc.StatusSignalSender;

public class MainVerticle extends Verticle {
	private static final Logger logger = LoggerFactory.getLogger(MainVerticle.class);
	private static ModuleConfiguration config;
	private RouteMatcher routeMatcher;
	
	@Override
	public void start() {
		config = new ModuleConfiguration(container.config());
		
		HttpServer httpServer = vertx.createHttpServer();
		initializeHTTPRouting(httpServer);

		// Start web server.
		httpServer.listen(config.getWebserverPort());
		
		JsonObject statusSignalObject = config.getStatusSingalConfiguration();
		StatusSignalConfiguration statusSignalConfig;
		if (statusSignalObject != null) {
		  statusSignalConfig = new StatusSignalConfiguration(statusSignalObject);
		} else {
		  statusSignalConfig = new StatusSignalConfiguration();
		}

		StatusSignalSender statusSignalSender =
		  new StatusSignalSender("iid-client", vertx, statusSignalConfig);
		statusSignalSender.start();

		logger.debug("Tablet client has been initialized with the following configuration:\n" + config.getJson().encodePrettily());
	}
	
	@Override
	public void stop() {
		logger.debug("Tablet client has been stopped.");
	}
	
	/**
	 * Returns the module configuration.
	 * @return Module configuration.
	 */
	public static ModuleConfiguration getConfig() {
		return config;
	}


	/**
	 * Initialize the HTTP server endpoints.
	 * @param httpServer HTTP server to add endpoints. 
	 */
	private void initializeHTTPRouting(HttpServer httpServer) {
		final String basePath = config.getWebserverBasePath();
		TemplateLoader loader = new ClassPathTemplateLoader();
		loader.setSuffix("");
		final Handlebars handlebars = new Handlebars(loader);
		routeMatcher = new BasePathRouteMatcher(basePath);
				
        routeMatcher.getWithRegEx("/templates/.*", new Handler<HttpServerRequest>() {
			
			@Override
			public void handle(HttpServerRequest request) {
				request.response().sendFile(request.path().substring(basePath.length() + 1));
			}
		});
		
		routeMatcher.postWithRegEx("/templates/.*", new Handler<HttpServerRequest>() {
			
			@Override
			public void handle(HttpServerRequest request) {
				final HttpServerResponse response = request.response();
				String templatePath = request.path().substring(basePath.length() + 1);
				final Template template; 
				try {
					template = handlebars.compile(templatePath);
				} catch (IOException e) {
					response.setStatusCode(404);
					response.end(e.getMessage());
					return;
				}
				request.bodyHandler(new Handler<Buffer>() {
					
					@Override
					public void handle(Buffer buffer) {
						JsonObject body = new JsonObject(buffer.toString());
						try {
							String result = template.apply(body.toMap());
							response.end(result);
						} catch (IOException e) {
							response.setStatusCode(500);
                            response.end(e.getMessage());
						}
					}
				});
			}
		});
		
		httpServer.requestHandler(routeMatcher);
	}
}
 