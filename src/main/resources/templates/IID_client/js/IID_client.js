/// <reference path="../templates/templ_appsist_popup.html" />
/// <reference path="../templates/templ_appsist_popup.html" />
var IID = (function ($) {
    //user and session
    var sessionId;
    var view;
    var eb;
    var user;
    var client_inf;
    var client_fingerprint;
    var isNew;

    //templates
    var tmpl_meldungen;
    var tmpl_stations;
    var tmpl_orte;
    var tmpl_contacts;
    var tmpl_instructions;
    var tmpl_wissen;
    var tmpl_siteInfo;
    var tmpl_assistance;
    var tmpl_lernobjekt;
    var tmpl_appsist_popup;
    var tmpl_appsist_frame_popup;

    //content
    var locations;
    var meldungen;
    var actual_assistance;
    var dummyContacts;
    var showARbutton;


    var ebHandler = function (request, response) {
        console.log('Received "' + request.action + '" request.', request);
        switch (request.action) {
            case "updateCatalog":
                var catalog = request.catalog;
                updateCatalog(catalog, response);
                break;
            case "purgeNotifications":
                purgeNotifications(response);
                break;
            case "showNotification":
                var notification = request.notification;
                showNotification(notification, response);
                break;
            case "dismissNotification":
                var id = request.notificationId;
                // Response added by Simon
                response({
                    'status': 'error',
                    'code': '500',
                    'message': 'Not implemented.'
                });
                //  dismissNotification(id, response);
                break;
            case "displayAssistance":
                var assistance = request.assistance;
                displayAssistance(assistance, response);
                break;
            case "displayLearningObject":
                var learningObject = request.learningObject;
                displayLearningObject(learningObject, response);
                break;
            case "displaySiteOverview":
                var siteOverview = request.siteOverview;
                displaySiteOverview(siteOverview, response);
                break;
            case "displayStationInfo":
                var stationInfo = request.stationInfo;
                response({
                    'status': 'error',
                    'code': '500',
                    'message': 'Not implemented.'
                });
                //displayStationInfo(stationInfo, response);
                break;
            case "displayPopup":
                var appsist_popup = request.popup;
                displayAppsistPopup(appsist_popup, response);
                break;
            case "releaseView":
                selectPage("page_anleitungen");
                response({
                    'status': 'ok'
                });
                break;
            case 'getStatus':
                sendHeartbeat(response);
                break;
            default:
                response({
                    'status': 'error',
                    'code': 400,
                    'message': 'Unknown action command: ' + request.action
                });
        }
    };

    var init = function () {
        client_inf = new ClientJS();
        client_fingerprint = client_inf.getFingerprint();
        console.log("Initialized client with finger print: " + client_fingerprint);
        isNew = true;

        var url_showAR = getUrlVars()["showAR"];

        showARbutton = false;
        if (isNaN(url_showAR)) {
            // Parameter showAR NICHT vorhanden
        }else {
            if (url_showAR != 0) {
                showARbutton = true;
                console.log("Show AR-Button");
            } else {
                console.log("Don't show AR-Button");
            }
        } 

        selectPage('login_container');
        $('#login_error').hide();

        var tmpl_src_meldungen = loadTXT('./templates/tmpl_meldungen.html');
        tmpl_meldungen = Handlebars.compile(tmpl_src_meldungen);//compile the template


        var tmpl_src_orte = loadTXT('./templates/tmpl_liste_orte.html');
        tmpl_orte = Handlebars.compile(tmpl_src_orte);//compile the template
        meldungen = new Array();

        var tmpl_src_stations = loadTXT('./templates/tmpl_cat_stations.html');
        tmpl_siteOverview = Handlebars.compile(tmpl_src_stations);

        var tmpl_src_contacts = loadTXT('./templates/tmpl_cat_contacts.html');
        tmpl_contacts = Handlebars.compile(tmpl_src_contacts);//compile the template

        var tmpl_src_instructions = loadTXT('./templates/tmpl_cat_anleitungen.html');
        tmpl_instructions = Handlebars.compile(tmpl_src_instructions);//compile the template

        var tmpl_src_wissen = loadTXT('./templates/tmpl_cat_wissen.html');
        tmpl_wissen = Handlebars.compile(tmpl_src_wissen);//compile the template

        var tmpl_src_siteInfo = loadTXT('./templates/tmpl_cat_siteInfo.html');
        tmpl_siteInfo = Handlebars.compile(tmpl_src_siteInfo);//compile the template

        var tmpl_src_assistance = loadTXT('./templates/tmpl_anleitung_step.html');
        tmpl_assistance = Handlebars.compile(tmpl_src_assistance);

        var tmpl_src_lernobjekt = loadTXT('./templates/tmpl_lernobjekt.html');
        tmpl_lernobjekt = Handlebars.compile(tmpl_src_lernobjekt);

        var tmpl_src_appsist_popup = loadTXT('./templates/tmpl_appsist_popup.html');
        tmpl_appsist_popup = Handlebars.compile(tmpl_src_appsist_popup);

        var tmpl_src_appsist_frame_popup = loadTXT('./templates/tmpl_appsist_frame_popup.html');
        tmpl_appsist_frame_popup = Handlebars.compile(tmpl_src_appsist_frame_popup);

        setDummyContacts("lps");


        actual_assistance = "-";
        var intervalVar;

        initializeEventbus();

        
    };

    function initializeEventbus() {
        if (eb == null || eb.readyState() == vertx.EventBus.CLOSED) {
            eb = new vertx.EventBus('/eventbus');

            eb.onclose = function () {
                console.log('Eventbus connection closed!');
                setTimeout(function () {
                    console.log('Trying to reinitialize the eventbus ...')
                    initializeEventbus();;
                }, 3000);
            };

            eb.onopen = function () {
                console.log('Eventbus connection opened!');
                registerView();
            };
        }
    }

    function registerView() {
        var deviceId = String(client_fingerprint);

        console.log('Trying to register view with device ID ' + deviceId + ' ...');
        var message = {
            'action': 'register',
            'deviceId': deviceId
        };
        eb.send('appsist:service:iid:server', message, function (response) {
            console.log('Received registering response: ', response);
            if (response.status == 'ok') {
                view = response.view;
                registerHandlers();
                if (response.session) {
                    sessionId = response.session.id;
                    if (isNew) {
                        IID.logout();
                        clearContent();
                    }
                } else {
                    selectPage('login_container');
                }
                isNew = false;
            } else {
                console.error(response);
            }
        });
    }


    function clearContent()
    {
        $('#content_anleitungen').empty();
        $('#content_wissen').empty();
        $('#content_lernobjekt').empty();
        $('#content_assistenz').empty();
        $('#content_contact').empty();
        $('#content_siteOverview').empty();
        $('#content_stations').empty();
        $('#liste_orte').empty();
        $('#meldungen_liste').empty();
    }


    function registerHandlers() {
        eb.unregisterHandler("appsist:service:iid:client:" + view.id, ebHandler);
        eb.registerHandler("appsist:service:iid:client:" + view.id, ebHandler);
    }

    var login = function () {
        var userId = $('input[name=userId]').val();
        userId = $.trim(userId);
        var uIdAtSplit = userId.split("@")[1];
        var uIdAtSplitDotSplit = uIdAtSplit.split(".")[0];
        setDummyContacts(uIdAtSplitDotSplit);
        var password = $('input[name=password]').val();
        password = $.trim(password);
        // Also we could use the password directly, we want to transfer only the hash.  
        var hash = CryptoJS.SHA256(password).toString();
        console.log('Login as user: ' + userId);
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "login",
            "userId": userId,
            "hash": hash
            //"password" : password
        }, function (response) {
            console.log('Login response:', response);
            if (response.status == "ok") {
                sessionId = response.session.id;
                console.log("Session-ID: " + sessionId);
                user = response.session.user;
                $('#login_error').hide();

                //add displayname to user menu
                var username = $('#display_username');
                username.empty();
                username.html(user.displayName);

                //Haupttätigkeit
                setUserActivity('main');

                // display locations
                getLocations();

                // show dummy contacts
                var cat = $('#content_contact');
                cat.empty();
                cat.html(tmpl_contacts(dummyContacts));
                $('#contacts_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });

                //show page "Anleitungen"
                $("#main_nav li.active").removeClass("active");
                $('#main_menu_anleitungen').addClass("active");

                selectPage("page_safety");
                //selectPage("page_anleitungen");

                //displaySiteOverview();
                var response = "";
                meldungen = [];
                setStartLocation();
                eb.registerHandler("", function () { });
                //var test_popup = { "title": "Titel Test-Popup" };
                //displayAppsistPopup(test_popup);

                //Test Betriebsdaten
                //var content =
                //    {
                //        "stations": [
                //            { "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "info", "content": { "type": "frame", "src": "/services/mid/sites/Anlage1/stations/Maschine20" } },
                //            { "station": "MachineIdentifier[stationID=Anlage1,machineID=Maschine30]", "level": "info", "content": { "type": "frame", "src": "/services/mid/sites/Anlage1/stations/Maschine30" } }],
                //        "site": "Anlage1"
                //    };

                //displaySiteOverview(content, response);

            } else {
                console.error(response);
                if (response.code == 500 && response.message == "The user is already logged in with a similar device.") {
                    $('#login_error').html("Benutzer wird bereits verwendet.");
                }
                else {
                    $('#login_error').html("Benutzername oder Passwort ist ungültig!");
                }
                $('#login_error').show();

            }
        });
    };

    var logout = function () {
        console.log('Logging out ...');
        eb.send("appsist:service:iid:server:" + view.id, {
            'action': 'logout'
        }, function (response) {
            console.log('Received logout response:', response);
            if (response.status == 'ok') {
                location.reload();              
            } else {
                console.error(response);              
            }
        });
    };

    var getLocations = function (user) {
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "getFixLocations"
        }, function (response) {
            if (response.status == "ok") {
                console.log("Getlocations: Response OK");
                //console.log(JSON.stringify(response.locations));

                locations = response.locations;
                var liste = $('#liste_orte');
                //liste.html(tmpl_orte(response));

                // add onClick function to display location symbol
                $('#liste_orte li').click(function () {
                    $('#liste_orte li span').hide(); //hide symbols for locations
                    $(this).children("span").show(); //enable symbol for actual location
                });
                $('#liste_orte li span').hide(); //hide symbols for locations
            } else {
                console.error(response);
            }
        });
    };

    function selectLocation(location_ID) {
        var myLocation;
        for (var i in locations) {
            var loc = locations[i];

            if (loc.id == location_ID) {
                myLocation = locations[i];
                break;
            }
        }

        if (myLocation != null) {
            //show current location in GUI
            var loc_string = myLocation.displayName.replace(":", ":<br />");
            $('#current_location').html(loc_string);

            //action select location 
            eb.send("appsist:service:iid:server:" + view.id, {
                "action": "setLocation",
                "location": myLocation
            }, function (response) {

                if (response.status == "ok") {
                    console.log("OK: Set location to: " + myLocation.id);
                } else {
                    console.error(response);
                }
            });
        }
    }


    function setUserActivity(user_role) {
        //action set user_role
     
        console.log("user_role: " + user_role);
       // var user_role = (toggleValue == true) ? "main" : "side";
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "setUserActivity",
            "sId": view.id,
            "activity": user_role
        }, function (response) {

            if (response.status == "ok") {
                console.log("OK: Set user_role to: " + user_role);
            } else {
                console.error(response);
                console.log("ERROR: Set user_role to: " + user_role + " -> did not work!");
            }
        });

        if (user_role == "main") {
            $("#main_activity span").addClass("icon-OK");
            $("#side_activity span").removeClass("icon-OK");
        } else {
            if (user_role == "side") {
                $("#side_activity span").addClass("icon-OK");
                $("#main_activity span").removeClass("icon-OK");
            }
        }
    }

    function showNotification(notification, response) {
        meldungen.push(notification);
        $('#show_meldungen').attr('data-toggle', 'dropdown');
        var liste = $('#meldungen_liste');
        liste.append(tmpl_meldungen(notification));
        var notificationAction = {};
        notificationAction.type = "post";
        notificationAction.address = "http://localhost:8093/services/psd/startSupport/" + notification.relatedItem;

        $("#" + notification.id).on('click', { action: notificationAction, }, function (event) {
            var action = event.data.action;
            performAction(action);
        });
        $('#notification_no').html(meldungen.length);
        response({
            'status': 'ok'
        });
    }

    function updateCatalog(catalog, response) {
        var error_state = false;
        switch (catalog.id) {
            case "instructions":
                var cat = $('#content_anleitungen');
                cat.empty();
                cat.html(tmpl_instructions(catalog));
                $('#instructions_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });

                //add actions
                for (var i in catalog.items) {
                    var cat_item = catalog.items[i];
                    if (cat_item.action) {
                        $('#instruction-' + cat_item.id).on('click', {
                            action: cat_item.action
                        }, function (event) {
                            var action = event.data.action;
                            performAction(action);
                        });
                    }
                }
                break;

            case "learningObjects":
                var cat = $('#content_wissen');
                cat.empty();
                cat.html(tmpl_wissen(catalog));
                $('#wissen_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });

                //show pdfs as overlay
                for (var i in catalog.items) {
                    var item = catalog.items[i];
                    if (item.action) {
                        $('#learningObjects-' + item.id).on('click', {
                            action: item.action
                        }, function (event) {
                            var action = event.data.action;
                            popupPDF(action.body.body.processId);
                        });
                    }
                }

                //for some reason item.title can not be passed in the same loop as the pdf url
                for (var i in catalog.items) {
                    var item = catalog.items[i];
                    if (item.action) {
                        $('#learningObjects-' + item.id).on('click', {
                            action: item.title
                        }, function (event) {
                            var action = event.data.action;
                            popupPDFTitle(action);
                        });
                    }
                }
                break;

            case "siteInfo":
                if (catalog.items.length > 0) {
                    console.log(JSON.stringify(catalog));
                    var cat = $('#content_siteOverview');
                    cat.empty();
                    cat.html(tmpl_siteInfo(catalog));

                    //add actions
                    for (var i in catalog.items) {
                        var item = catalog.items[i];
                        if (item.action) {
                            $('#station-ID-' + item.id).on('click', {
                                action: item.action
                            }, function (event) {
                                var action = event.data.action;
                                performAction(action);
                            });
                        }
                    }
                } else {
                    console.log("Catalog siteInfo is empty!");
                }
                break;

            case "contacts":
                var cat = $('#content_contact');
                cat.empty();
                cat.html(tmpl_contacts(catalog));
                $('#wissen_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });
                break;

            default:
                error_state = true;

        }

        if (error_state) {
            console.log("ERROR: No catalog with ID: " + catalog.id);
            response({
                'status': 'error',
                'code': 400,
                'message': 'Unknown catalog: ' + catalog.id
            });
        } else {
            console.log("OK: Updated catalog with ID: " + catalog.id);
            response({
                'status': 'ok'
            });
        }
    }

    function displayAssistance(assistance, response) {
        var assist = $('#content_assistenz');
        assist.empty();
        assist.html(tmpl_assistance(assistance));

        console.log(JSON.stringify(assistance.navigation));

        //add title of assitance process
        $('#assistance_title').html(actual_assistance);

        //add actions
        for (var i in assistance.navigation) {
            var test = i.toString();
            if (i.toString() == "buttons") {
                // add actions to big blue action buttons
                for (var b = 0; b < assistance.navigation.buttons.length; b++) {
                    //console.log("Button-ID [" + b + "]" + " " + assistance.navigation.buttons[b].id);                   
                    var item = assistance.navigation.buttons[b];
                    if (item.action) {
                        $('#nav_button-' + item.id).on('click', {
                            action: item.action
                        }, function (event) {
                            var action = event.data.action;
                            performAction(action);
                        });
                    }
                }
            } else {
                // add actions to small grey buttons
                var assi_item = assistance.navigation[i];
                console.log("add action: " + i);

                $('#assi_' + i).on('click', {
                    action: assi_item
                }, function (event) {
                    var action = event.data.action;
                    performAction(action);
                });
            }
        }

        //show hide AR button
        if (showARbutton == true) {
            // Elternelement aller span-Elemente der Klasse "glyphicon-eye-open" ausblenden/anzeigen. (d.h. die AR-Buttons)
            $('span.glyphicon-eye-open').parent().show();
        } else {
            $('span.glyphicon-eye-open').parent().hide();
        }

        response({
            'status': 'ok'
        });

        selectPage('page_assistenz');

    }


    function displayLearningObject(learning, response) {
        var assist = $('#content_lernobjekt');
        assist.empty();
        assist.html(tmpl_lernobjekt(learning));

        //Tabs-Navigation
        $(".tabs-menu a").click(function (event) {
            event.preventDefault();
            $(this).parent().addClass("current");
            $(this).parent().siblings().removeClass("current");
            var tab = $(this).attr("href");
            $(".tab-content").not(tab).css("display", "none");
            $(tab).fadeIn();
        });

        selectPage('page_lernobjekt');

        response({
            'status': 'ok'
        });
    }

    function displaySiteOverview(siteOverview, response) {
        //var content_test = {
        //    "stations": [{ "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "info", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } },
        //    { "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "info", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } },
        //    { "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "error", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } },
        //    { "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "warning", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } }], "site": "Anlage1"
        //};

        var cat = $('#content_stations');
        cat.empty();
        cat.html(tmpl_siteOverview(siteOverview));
        //cat.html(tmpl_siteOverview(content_test));
        $('#stations_overview_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });    
        selectPage('page_stations');

        response({
            'status': 'ok'
        });
    }

    function purgeNotifications(response) {
        meldungen = [];
        $('#show_meldungen').attr('data-toggle', 'dropdown');
        var liste = $('#meldungen_liste');
        liste.html("");
        $('#notification_no').html(meldungen.length);
        response({
            'status': 'ok'
        });
    }

    function popupPDF(url) {
        console.log("URL: " + url);
        $('#pdf_container').html("<object data=" + url.toString() + " type='application/pdf' width='100%' height='100%'></object>");
        $('#alert_wissen_PDF').modal('show');
    }

    function popupPDFTitle(pdftitle) {
        $('#wissen_titel').html(pdftitle);
    }

    function displayAppsistPopup(appsist_popup, response)
    {
        var popup_content = $('#alert_appsist_popup');
        popup_content.empty();

        if (appsist_popup.body.type == "frame")
        {          
            popup_content.html(tmpl_appsist_frame_popup(appsist_popup));
        }
        else
        {
           
            popup_content.html(tmpl_appsist_popup(appsist_popup));


            if (appsist_popup.buttons) {
                //add actions
                for (var b = 0; b < appsist_popup.buttons.length; b++) {
                    //console.log("Button-ID [" + b + "]" + " " + popup.buttons[b].id);                   
                    var item = appsist_popup.buttons[b];
                    if (item.action) {
                        //console.log("vorherigebtn: " + item.id);
                        console.log("index: " + item.action.body.index);
                        $('#popup_button-' + item.action.body.index).on('click', {
                            action: item.action
                        }, function (event) {
                            var action = event.data.action;
                            performAction(action);
                        });
                    }
                }
            }
        }
        $('#alert_appsist_popup').modal('show');
        response({
            'status': 'ok'
        });
    }

    function sendHeartbeat(response) {
  
        response({
            'status': 'ok'
        });
    }

    function performAction(action) {
        console.log("Performing action:", action);
        if (action.address.indexOf("openExternalContent") != -1) {
            window.open(action.body.body.processId);
        } else {
            eb.send("appsist:service:iid:server:" + view.id, {
                "action": "performAction",
                "actionToPerform": action
            }, function (response) {
                console.log("Action response: " + JSON.stringify(response, null, 2));
            });
        }
    }




    function selectPage(page) {
        $('.page').hide();
        $('#' + page).show();

        //Navigation
        if (page == "login_container" || page == "page_assistenz" || page == "page_safety") {
            $('#navigation_menu').hide();
        } else {
            $('#navigation_menu').show();
        }

        $(window).trigger('resize');
    }


    function loadTXT(url) {
        var data = "<h1> failed to load url : " + url + "</h1>";
        $.ajax({
            async: false,
            dataType: "text",
            url: url,
            success: function (response) {
                data = response;
            }
        });
        return data;
    }

    function setAssistance(title) {
        actual_assistance = title;
    }

    function setStartLocation() {
        selectLocation('demoMontage');
        $('#demoMontage').children("span").show(); //enable symbol for actual location
    }


    function clientHeartbeat() {
        window.setInterval(function () { eb.send("appsist:clientHeartbeat", { "data": "blip" }), 1000 });
    }

    function showARscene(ar_id) {
        console.log("showARscene " + ar_id + "!!");
        if (typeof UWK != "undefined") {
            UWK.sendMessage('showAR', { 'showAR': true, 'AR_ID': ar_id });
        }
        else {
            // $.get("http://localhost:8082/appsist/AR_Scene/"+ar_id);
            var theUrl = "http://localhost:8082/appsist/AR_Scene/" + ar_id;
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open("GET", theUrl, false); // false for synchronous request
            xmlHttp.timeout = 2000; // time in milliseconds
            xmlHttp.send(null);
           // return xmlHttp.responseText;
        }

    }

    function setDummyContacts(ipa) {
        switch (ipa) {
            case 'festo':
                dummyContacts = {
                    "id": "contacts", "items": [
                       { "catalog": "contacts", "displayName": "Herr Andre Brenner", "role": "LGV (PF-RSMN)", "id": "contact_festo_001", "imageUrl": "./img/kontakt_andre_brenner.png", "phone_no": null },
                       { "catalog": "contacts", "displayName": "Herr Daniel Dörr", "role": "Anlagenführer (PF-RSMN Bereich DSBC)", "id": "contact_festo_002", "imageUrl": "./img/kontakt_daniel_doerr.jpg", "phone_no": null },
                       { "catalog": "contacts", "displayName": "Frau Sandra Strempel", "role": "Anlagenführerin (PF-RSMN Bereich DSBC)", "id": "contact_festo_003", "imageUrl": "./img/kontakt_sandra_strempel.png", "phone_no": null }
                    ]
                };
                break;
            case 'bul':
                dummyContacts = {
                    "id": "contacts", "items": [
                       { "catalog": "contacts", "displayName": "Herr Markus Koch", "role": "Konstrukteur", "id": "contact_bul_001", "imageUrl": "./img/kontakt_markus_koch.jpg", "phone_no": null },
                       { "catalog": "contacts", "displayName": "Herr Armin Grünewald", "role": "Zerspanungsmechaniker\n(Fräse kon./CNC)", "id": "contact_bul_002", "imageUrl": "./img/kontakt_armin_gruenewald.jpg", "phone_no": null }
                    ]
                };
                break;
            case 'mbb':
                dummyContacts = {
                    "id": "contacts", "items": [
                       { "catalog": "contacts", "displayName": "Herr Siegfried Fecke", "role": "Applikation Verbindungstechnik", "id": "contact_mbb_001", "imageUrl": "./img/kontakt_siegfried_fecke.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(2586) 888-7191" },
                       { "catalog": "contacts", "displayName": "Herr Dominik Krampe", "role": "Applikation Steuerungstechnik", "id": "contact_mbb_002", "imageUrl": "./img/kontakt_dominik_krampe.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(2586) 888-7388" },
                       { "catalog": "contacts", "displayName": "Herr Daniel Fahl", "role": "Applikation Messtechnik", "id": "contact_mbb_003", "imageUrl": "./img/kontakt_daniel_fahl.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(2586) 888-7442" },
                       { "catalog": "contacts", "displayName": "Frau Frauke Bökhaus", "role": "Service", "id": "contact_mbb_004", "imageUrl": "./img/kontakt_frauke_boekhaus.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(2586) 888-7191" }
                    ]
                };
                break;

            case 'lps':
                dummyContacts = {
                    "id": "contacts", "items": [
                       { "catalog": "contacts", "displayName": "Herr Holger Sturmberg", "role": "Zerspanungsmechaniker\n(Bereich Dreh- und Fräsmaschinen)", "id": "contact_lps_001", "imageUrl": "./img/kontakt_holger_sturmberg.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(234) 322-7497" },
                       { "catalog": "contacts", "displayName": "Herr Ingo Holzweißig", "role": "Elektrotechniker\n(Bereich E-Werkstatt)", "id": "contact_lps_002", "imageUrl": "./img/kontakt_ingo_holzweissig.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(234) 322-7471" }
                    ]
                };
                break;
            default:
                // demo case
                dummyContacts = {
                    "id": "contacts", "items": [
                        { "catalog": "contacts", "displayName": "Herr Markus Rebmann", "role": "Leitung Großserien 6 Normzylinder (PF-RGP6)", "id": "contact_demo_001", "imageUrl": "./img/kontakt_markus_rebmann.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(30) 123-455" },
                        { "catalog": "contacts", "displayName": "Frau Anabelle Müller", "role": "Mechatronikerin Großserien 7 Kurzhubzylinder Grp. 3 (RF-RGP7-3)", "id": "contact_demo_002", "imageUrl": "./img/kontakt_eva_minnig.jpg", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(30) 123-456" }
                    ]
                };
        }

    }

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            vars[key] = value;
        });
        return vars;
    }



    return {
        init: init,
        login: login,
        logout: logout,
        getLocations: getLocations,
        selectLocation: selectLocation,
        setUserActivity: setUserActivity,
        setAssistance: setAssistance,
        performAction: performAction,
        //open for development only 
        selectPage: selectPage,
        setStartLocation: setStartLocation,
        showARscene: showARscene,
        popupPDF: popupPDF
    };
})($);