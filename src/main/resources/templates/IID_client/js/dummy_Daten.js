function test_dummy_Daten() {
    var cat_anleitung = {
        "id": "instructions", "items": [
          { "catalog": "instructions", "id": "real", "priority": 50, "service": "iid", "title": "Start Simple Process", "action": { "type": "post", "address": "http://localhost:8080/services/iid/debug/echo", "body": { "foo": "bar" } } },
          { "catalog": "instructions", "id": "3", "priority": 1, "service": "iid", "title": "11", "numExecutions": 2, "estExecutionTime": 5 },
          { "catalog": "instructions", "id": "2", "priority": 2, "service": "iid", "title": "22" },
          { "catalog": "instructions", "id": "1", "priority": 3, "service": "iid", "title": "33" },
          { "catalog": "instructions", "id": "4", "priority": 1, "service": "iid", "title": "44", "numExecutions": 2, "estExecutionTime": 5 },
           { "catalog": "instructions", "id": "5", "priority": 1, "service": "iid", "title": "55", "numExecutions": 2, "estExecutionTime": 5 },
            { "catalog": "instructions", "id": "6", "priority": 1, "service": "iid", "title": "66", "numExecutions": 2, "estExecutionTime": 5 },
        ]
    };

    var cat_wissen = {
        "id": "learningObjects", "items": [
{ "catalog": "learningObjects", "id": "l3", "priority": 1, "service": "iid", "progress": 0.1, "title": "Third", "hasVideo": true },
{ "catalog": "learningObjects", "id": "l2", "priority": 2, "service": "iid", "progress": 0.2, "title": "Second", "hasVideo": true },
{ "catalog": "learningObjects", "id": "l1", "priority": 3, "service": "iid", "progress": 0.5, "title": "First", "hasVideo": true },
{ "catalog": "learningObjects", "id": "l4", "priority": 1, "service": "iid", "progress": 0.1, "title": "44", "hasVideo": true },
{ "catalog": "learningObjects", "id": "l5", "priority": 2, "service": "iid", "progress": 0.2, "title": "55", "hasVideo": true },
{ "catalog": "learningObjects", "id": "l6", "priority": 3, "service": "iid", "progress": 0.5, "title": "66", "hasVideo": true }]
    };

    var anleitung_step01 = {
        "navigation": {
            "buttons": [
                {
                    "id": "previous",
                    "text": "Zur�ck",
                    "action": {
                        "type": "post",
                        "address": "/foo/bar",
                        "body": {
                            "action": "previous"
                        }
                    }
                },
                {
                    "id": "next",
                    "text": "Weiter",
                    "action": {
                        "type": "post",
                        "address": "/foo/bar",
                        "body": {
                            "action": "next"
                        }
                    }
                }
            ],
            "back": {
                "type": "appsist-event",
                "model": "myEvent",
                "payload": {
                    "action": "back"
                }
            },
            "close": {
                "type": "event",
                "address": "appsist:service:foo",
                "body": {
                    "action": "close"
                }
            },
            "contacts": {
                "type": "post",
                "address": "/foo/bar",
                "body": {
                    "action": "contact"
                }
            },
            "notes": {
                "type": "post",
                "address": "/foo/bar",
                "body": {
                    "action": "note"
                }
            }
        },
        "title": {
            "previous": "Erster Schritt",
            "current": "Standard-Schritt",
            "next": "N�chster Schritt"
        },
        "progress": 0.5,
        "content": {
            "type": "package",
            "id": "default",
            "main": "led-gruen.jpg",
            "mimeType": "image/jpeg",
            "lastUpdate": "2015-08-05T08:29:36+02:00",
            "version": "1.0"
        },
        "info": "Tun sie was getan werden muss.",
        "warnings": [
            {
                "message": "Achtung: Was auch immer sie tun, seien sie vorsichtig!",
                "icon": "images/aetzend.jpg"
            }
        ]
    }

    var content_lernobjekt = {
        "chapters": [
            {
                "caption": "Mein erstes Kapitel",
                "content": {
                    "type": "frame",
                    "src": "http://www.heise.de/"
                }
            },
            {
                "caption": "Mein zweites Kapitel",
                "content": {
                    "type": "frame",
                    "src": "http://www.heise.de/"
                }
            },
            {
                "caption": "Mein drittes Kapitel",
                "content": {
                    "type": "html",
                    "body": "<p>Es war einmal ... 33333333333</p>"
                }
            }
        ],
        "title": "Mein Thema"
    }

    updateCatalog(cat_anleitung);
    updateCatalog(cat_wissen);
    displayAssistance(anleitung_step01);
    displayLearningObject(content_lernobjekt);
}