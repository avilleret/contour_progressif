window.onload = function() {
    var ws = new WebSocket("ws://" + window.location.hostname + ":5678");
    var main = new dat.GUI({ autoPlace: false, width: 300});
    var namespace = new Object;

    var customContainer = document.getElementById('gui');
    customContainer.appendChild(main.domElement);

    ws.onopen = function(mess) {
        // This way the protocol will always try to send 
        // data through websockets.
        ws.send("/?SET_PORT=0");
        ws.send("/");
    }

    ws.onmessage = function(mess) {
        // An OSCQuery value json looks like 
        // { "/the/addr" : 123 }
        console.log(mess.data);
        var json = JSON.parse(mess.data);

        if ("CONTENTS" in json)
        {
            var content = json["CONTENTS"];

            for(var prop in content) {
                parseOSCQuery(content[prop], namespace, main, prop);
            }
        } else {
            parseOSCQuery(json, namespace, main, '/');
        }

        function parseOSCQuery(json, obj, gui, name)
        {
            console.log(json);

            if ("CONTENTS" in json)
            {
                var content = json["CONTENTS"];
                var folder = gui.addFolder(name);

                for(var prop in content) {
                    parseOSCQuery(content[prop], obj, folder, prop);
                }
            }
            
            if (("FULL_PATH" in json) && ("VALUE" in json) && json["ACCESS"] == 3 )
            {
                type = json["TYPE"];
                if (type == "f")
                {
                    obj[name] = json["VALUE"];

                    var range = json["RANGE"];
                    var ctl = gui.add(obj, name, range["MIN"], range["MAX"], 0.1).listen();
                    
                    ctl.onChange(function(value) {
                        ws.send('{"' + json["FULL_PATH"] + '":' + value + '}');
                    })
                }
                else if (type == "i")
                {
                    obj[name] = json["VALUE"];

                    var range = json["RANGE"];
                    var ctl = gui.add(obj, name, range.MIN, range.MAX, 1).listen();
                    
                    ctl.onChange(function(value) {
                        ws.send('{"' + json["FULL_PATH"] + '":' + value + '}');
                    })
                }
                else if (type == "ff")
                {
                    console.log(json);
                    obj[name] = { 
                        x : json["VALUE"][0], 
                        y : json["VALUE"][1]
                    }
                    var range_x = json["RANGE"][0];
                    var range_y = json["RANGE"][1];

                    console.log(range_x);
                    console.log(range_y);

                    var folder = gui.addFolder(name);
                    var x_ctl = folder.add(obj[name], 'x', range_x.MIN, range_x.MAX, 0.1);
                    var y_ctl = folder.add(obj[name], 'y', range_y.MIN, range_y.MAX, 0.1);

                    x_ctl.onChange(function(value) {
                        ws.send('{"' + json["FULL_PATH"] + '":[' + value + ',' + obj[name].y + ']}');
                    })

                    y_ctl.onChange(function(value) {
                        ws.send('{"' + json["FULL_PATH"] + '":[' + obj[name].x + ',' + value + ']}');
                    })
                }
                else if (type  == "fff")
                {
                    obj[json["FULL_PATH"]] = { 
                        x : json["VALUE"][0], 
                        y : json["VALUE"][1],
                        z : json["VALUE"][2]
                    }
                }
                else if (type  == "ffff")
                {
                    obj[json["FULL_PATH"]] = { 
                        r : json["VALUE"][0], 
                        g : json["VALUE"][1],
                        b : json["VALUE"][2],
                        a : json["VALUE"][3]
                    }
                }
                else if (type == "F" || type == "T")
                {
                    obj[name] = json["VALUE"];

                    var ctl = gui.add(obj, name);
                    
                    ctl.onChange(function(value) {
                        ws.send('{"' + json["FULL_PATH"] + '":' + value + '}');
                    })
                }
                else if (type == "s")
                {
                    obj[name] = json["VALUE"];

                    var range = json["RANGE"];
                    var ctl = gui.add(obj, name, range).listen();
                    
                    ctl.onFinishChange(function(value) {
                        ws.send('{"' + json["FULL_PATH"] + '":"' + value + '"}');
                        console.log(json["FULL_PATH"] + " : " + value);
                    })
                }
                else if (type == "I") // impulse
                {
                    var btn = { add:function(){ 
                           ws.send('{"' + json["FULL_PATH"] + '":null}');
                           console.log(json["FULL_PATH"]);
                    }};
                    gui.add(btn, 'add').name(name);
                }

            }
            else
            {
                var keys = Object.keys(json).forEach(function(key) {
                    console.log(key + " " + json[key] )
                    var nodes = key.split("/");

                    console.log(nodes[1] + " " + json[key])
                    obj[nodes[1]] = json[key];

                });

                var keys = Object.keys(obj).forEach(function(key) {
                    console.log(key + " " + obj[key] )
                });
            }

            return obj;
        }

        //console.log(this.ouiouisquery);

    } 
}
