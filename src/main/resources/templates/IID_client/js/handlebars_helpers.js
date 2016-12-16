Handlebars.registerHelper('mult100', function (inputVal) {
    var ret = parseFloat(inputVal);    

    if (isNaN(ret)) {
        return 0;
    } else {
        ret= ret* 100
        return ret.toFixed();
    }
});

Handlebars.registerHelper("inc", function (value, options) {
    return parseInt(value) + 1;
});

Handlebars.registerHelper("showContent", function (value) {
    if (value.type == "empty") {
      //  console.log("ShowContent: empty -> false");
        return false;
    } else {
        if (value.type = "package" && (value.main == null)) {
          //  console.log("ShowContent: main == null -> false");
            return false;
        }
    }
        console.log("ShowContent: true");
        return true;
});

Handlebars.registerHelper("getHTML", function (html_url) {
    var data = "<h>" + "Not found: " + html_url + "</h1>";
    $.ajax({
        async: false,
        dataType: "text",
        url: html_url,
        success: function (response) {
            data = response;
        }
    });
    return data;
});


//loads snippet for video, changes relative path to absolute path
Handlebars.registerHelper("getVideoHTML", function (html_url) {
    loaded = false;
    var html_str = "<h>" + "Not found: " + html_url + "</h1>";

    $.ajax({
        async: false,
        dataType: "text",
        url: html_url,
        success: function (response) {
            html_str = response;
            loaded = true;
        }
    });

    if (loaded) {
        end_index = html_url.lastIndexOf("/");
        prefix = html_url.substring(0, end_index + 1);

        html_str = html_str.replace(/src=\"/g, "src=\"" + prefix);
        html_str = html_str.replace(/poster=\"/g, "poster=\"" + prefix);
    }
    return html_str;
});


//loads snippet for video, changes relative path to absolute path
Handlebars.registerHelper("getVideoButton", function (html_url) {
    var loaded = false;
    var html_result = "<h>" + "Not found: " + html_url + "</h1>";

    $.ajax({
        async: false,
        dataType: "text",
        url: html_url,
        success: function (response) {
            html_str = response;
            loaded = true;
        }
    });

    if (loaded) {
        var end_index = html_url.lastIndexOf("/");
        var prefix = html_url.substring(0, end_index + 1);        

        var i_filetype = html_str.lastIndexOf(".webm");
        var i_filename = html_str.lastIndexOf("src=\"", i_filetype);
        var file_name = prefix + html_str.substring(i_filename + 5, i_filetype + 5);

        var html_result = "<button type=\"submit\" class=\"btn btn-appsist\" onclick='if (typeof UWK !=\"undefined\") UWK.sendMessage(\"openFile\", {\"openFile\": true, \"filetype\": \"webm\", \"file_url\": \"RESULT\"})' >Video als Vollbild</button>";
        html_result = html_result.replace("RESULT", file_name);
    }
    return html_result;
});

Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue
    }[operator];
});

Handlebars.registerHelper("getTime", function (value, options) {
    var myDate = new Date(value);

    if (isFinite(myDate)) {
        var hours = myDate.getHours().toString();

        if (hours.length < 2)
            hours = "0" + hours;

        var minutes = myDate.getMinutes().toString();

        if (minutes.length < 2)
            minutes = "0" + minutes;

        var output = hours + ":" + minutes;

        return (output);
    } else {
        return ("00:00");
    }
});

Handlebars.registerHelper("getMachineID", function (value, options) {
    //extracts machine ID from given station-string

    var machine_ID = value;
    var search_pattern = 'machineID=';
    var iMachine = machine_ID.indexOf(search_pattern);

    if (iMachine > -1) {
        return machine_ID.substring(iMachine + search_pattern.length, machine_ID.length - 1);
    } else
        return "No Machine ID";
});



Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
    var operators, result;

    if (arguments.length < 3) {
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
    }

    if (options === undefined) {
        options = rvalue;
        rvalue = operator;
        operator = "===";
    }

    operators = {
        '==': function (l, r) { return l == r; },
        '===': function (l, r) { return l === r; },
        '!=': function (l, r) { return l != r; },
        '!==': function (l, r) { return l !== r; },
        '<': function (l, r) { return l < r; },
        '>': function (l, r) { return l > r; },
        '<=': function (l, r) { return l <= r; },
        '>=': function (l, r) { return l >= r; },
        'typeof': function (l, r) { return typeof l == r; },
        'includes': function (l, r) { return l.indexOf(r) !== -1 }
    };

    if (!operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
    }

    result = operators[operator](lvalue, rvalue);

    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
