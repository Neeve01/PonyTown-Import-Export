// ==UserScript==
// @name        PonyTown Import/Export
// @namespace   azedith
// @include     https://pony.town/*
// @author		@NotMyWing
// @version     1
// @grant       none
// @downloadURL	https://github.com/Neeve01/PonyTown-Import-Export/raw/master/PonyTown_IE.user.js
// ==/UserScript==

(function() {
    'use strict';

    var targetPonyTownVersion = "0.28.4-alpha";
    var githubLink = "https://github.com/Neeve01";
    var twitterLink = "https://twitter.com/NotMyWing";
    var githubScriptLink = "https://github.com/Neeve01/PonyTown-Import-Export";

    var clickEvent = new Event('click');
    var inputEvent = new Event('input');
    var mousedownEvent = new Event('mousedown');
    var mouseupEvent = new Event('mouseup');

    var exists = function(a) {
        return (typeof(a) !== 'undefined') && (a !== null);
    };

    var Sleep = function(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time);
        });
    };

    var observer_target = document.querySelector("pony-town-app");

    if (!exists(observer_target)) {
        return;
    }

    var Utils = {
        DefineSet: function(tab, title, out) {
            let set = tab.querySelector('[label="' + title + '"]');

            if (!exists(set)) {
                return;
            }

            let sprite_selection = set.querySelectorAll('sprite-selection');
            let divs = set.children;
            let utils = this;

            this.DefineSpriteSelection(out, "Type", sprite_selection[0]);

            Object.defineProperty(out, "Pattern", {
                get: function() {
                    let sprite_selection = set.querySelectorAll('sprite-selection')[1];
                    if (exists(sprite_selection)) {
                        return utils.GetSelectedSprite(sprite_selection);
                    }
                },
                set: function(value) {
                    let sprite_selection = set.querySelectorAll('sprite-selection')[1];
                    if (exists(sprite_selection)) {
                        utils.SetSelectedSprite(sprite_selection, value);
                    }
                    return true;
                }
            });

            this.DefineColorArray(out, "Colors", "Outlines", [
                divs[divs.length - 6],
                divs[divs.length - 5],
                divs[divs.length - 4],
                divs[divs.length - 3],
                divs[divs.length - 2],
                divs[divs.length - 1]
            ]);
        },
        DefineColorPicker: function(obj, fieldname, picker) {
            let utils = this;
            Object.defineProperty(obj, fieldname, {
                get: function() {
                    if (exists(picker)) {
                        let value = utils.GetTextValue(picker);
                        if (exists(value)) {
                            return value.toLowerCase();
                        }
                    }
                },
                set: function(value) {
                    if (exists(picker)) {
                        utils.SetTextValue(picker, exists(value) ? value.toLowerCase() : value);
                    }
                    return true;
                }
            });
        },
        DefineSpriteSelection: function(obj, fieldname, picker) {
            let utils = this;
            Object.defineProperty(obj, fieldname, {
                get: function() {
                    if (exists(picker)) {
                        return utils.GetSelectedSprite(picker);
                    }
                },
                set: function(value) {
                    if (exists(picker)) {
                        utils.SetSelectedSprite(picker, value);
                    }
                    return true;
                }
            });
        },
        DefineCheckbox: function(obj, fieldname, checkbox) {
            let utils = this;
            Object.defineProperty(obj, fieldname, {
                get: function() {
                    if (exists(checkbox)) {
                        return utils.IsCheckboxChecked(checkbox);
                    }
                },
                set: function(value) {
                    if (exists(checkbox)) {
                        utils.SetCheckbox(checkbox, value);
                    }
                    return true;
                }
            });
        },
        DefineColorArray: function(obj, colorfieldname, outlinefieldname, divs) {
            let length = divs.length;
            let utils = this;
            var colorproxy = new Proxy({}, {
                get: function(t, id) {
                    if (id == "length") {
                        return length;
                    }
                    if (exists(divs[id]) && exists(divs[id].querySelector)) {

                        let picker = divs[id].querySelector("color-picker");
                        if (picker) {
                            return utils.GetTextValue(picker);
                        }
                    }
                },
                set: function(t, id, value) {
                    if (exists(divs[id]) && exists(divs[id].querySelector)) {
                        let picker = divs[id].querySelector("color-picker");
                        if (picker) {
                            utils.SetTextValue(picker, value);
                        }
                    }
                    return true;
                }
            });

            var outlineproxy = new Proxy({}, {
                get: function(t, id) {
                    if (id == "length") {
                        return length;
                    }
                    if (exists(divs[id]) && exists(divs[id].querySelectorAll)) {
                        let picker = divs[id].querySelectorAll("color-picker")[1];
                        if (picker) {
                            return utils.GetTextValue(picker);
                        }
                    }
                },
                set: function(t, id, value) {
                    if (exists(divs[id]) && exists(divs[id].querySelectorAll)) {
                        let picker = divs[id].querySelectorAll("color-picker")[1];
                        if (picker) {
                            utils.SetTextValue(picker, value);
                        }
                    }
                    return true;
                }
            });

            Object.defineProperty(obj, colorfieldname, {
                get: function() {
                    return colorproxy;
                }
            });

            Object.defineProperty(obj, outlinefieldname, {
                get: function() {
                    return outlineproxy;
                }
            });
        },
        EraseButtmark: function() {
            let erase_button = document.querySelector('[title="Clear all"]');
            erase_button.dispatchEvent(clickEvent);
        },
        PickBrush: function() {
            let brush_button = document.querySelector('[title="Brush"]');
            brush_button.dispatchEvent(clickEvent);
        },
        SetPixel: function(element, value) {
            let erase_button = document.querySelector('[title="Clear all"]');
            let brush_picker = erase_button.parentNode.parentNode.querySelector("color-picker");
            this.SetTextValue(brush_picker, value);
            element.dispatchEvent(mousedownEvent);
            element.dispatchEvent(mouseupEvent);
        },
        IsCheckboxChecked: function(element) {
            return element.children[0].children.length > 0;
        },
        GetSelectedSprite: function(element) {
            if (element.tagName == "SPRITE-SELECTION") {
                element = element.children[0].children[0];

                if (!exists(element.querySelector("sprite-box.active"))) {
                    let show_more = element.querySelector('[title="Show more..."]');
                    if (exists(show_more)) {
                        show_more.dispatchEvent(clickEvent);
                    }
                }
                if (!exists(element.querySelector("sprite-box.active"))) {
                    return;
                }

                let sprites = element.querySelectorAll("sprite-box");
                for (var i = 0; i < sprites.length; i++) {
                    if (sprites[i].className.search("active") != -1) {
                        return i;
                    }
                }
            }
        },
        SetSelectedSprite: function(element, sprite) {
            if (element.tagName == "SPRITE-SELECTION") {
                let selection = element;
                element = element.children[0].children[0];

                let sprites = element.querySelectorAll("sprite-box");

                if (sprite > sprites.length - 1) {
                    let show_more = selection.querySelector('[title="Show more..."]');
                    if (exists(show_more)) {
                        show_more.dispatchEvent(clickEvent);
                        sprites = selection.querySelectorAll("sprite-box");
                    } else {
                        return;
                    }
                }

                if (sprite >= 0 && sprite <= sprites.length) {
                    sprites[sprite].dispatchEvent(clickEvent);
                }
            }
        },
        SetCheckbox: function(element, value) {
            if (!exists(element)) { return; }
            if (element.tagName == "CHECK-BOX") {
                if (this.IsCheckboxChecked(element) != value) {
                    element.children[0].dispatchEvent(clickEvent);
                }
            } else if (element.tagName == "COLOR-PICKER") {
                // If it's lockable, then checkbox should be one element before.
                let container = element.parentNode,
                    parent = container.parentNode;

                for (var i = 0; i < parent.children.length; i++) {
                    if (parent.children[i] == container) {
                        if (i === 0) { return; }

                        let el = parent.children[i - 1];
                        if (el.children.length) {
                            let checkbox = el.querySelector("check-box");
                            if (!exists(checkbox)) { return; }

                            if (checkbox.getAttribute("icon") === "fa-check") {
                                value = !value;
                            }
                            this.SetCheckbox(checkbox, value);
                        }
                        return;
                    }
                }
            }
        },
        GetTextValue: function(element) {
            if (element.tagName == "COLOR-PICKER") {
                element = element.children[0];
                if (element === null) { return; }
                if (this.IsDisabled(element)) {
                    return;
                }

                for (var i = 0; i < element.children.length; i++) {
                    if (element.children[i].tagName == "INPUT") {
                        element = element.children[i];
                    } else if (i == element.children.length - 1) {
                        return;
                    }
                }
            }
            return element.value;
        },
        SetTextValue: function(element, value) {
            if (element.tagName == "COLOR-PICKER") {
                element = element.children[0];
                if (element === null) { return; }

                if (value === null || value === "") {
                    this.SetCheckbox(element.parentNode, true);
                    return;
                }

                if (this.IsDisabled(element)) {
                    this.SetCheckbox(element.parentNode, false);
                }

                for (var i = 0; i < element.children.length; i++) {
                    if (element.children[i].tagName == "INPUT") {
                        element = element.children[i];
                    } else if (i == element.children.length - 1) {
                        return;
                    }
                }
            }
            element.value = value;
            element.dispatchEvent(inputEvent);
        },
        IsDisabled: function(element) {
            if (element.tagName == "COLOR-PICKER") {
                element = element.children[0];
                if (element === null) { return; }
                if (element.className.search("disabled") != -1) {
                    return true;
                }
            }
            return element.className.search("disabled") != -1;
        },
        NullifyArray: function(arr) {
            for (var i = 0; i < arr.length; i++) {
                arr[i] = null;
            }
        },
        ImportBlock: function(_from, _to) {
            if (!exists(_from)) {
                _to.Type = 0;
                _to.Pattern = 0;
                this.NullifyArray(_to.Colors);
                this.NullifyArray(_to.Outlines);
                return;
            }

            _to.Type = exists(_from.Type) ? _from.Type : 0;
            _to.Pattern = exists(_from.Pattern) ? _from.Pattern : 0;

            this.NullifyArray(_to.Colors);
            if (exists(_from.Colors)) {
                for (var i = 0; i < _from.Colors.length; i++) {
                    _to.Colors[i] = _from.Colors[i];
                }
            }

            this.NullifyArray(_to.Outlines);
            if (exists(_from.Outlines)) {
                for (var i = 0; i < _from.Outlines.length; i++) {
                    _to.Outlines[i] = _from.Outlines[i];
                }
            }
        },
        ExportColorArray: function(colors_in, outlines_in, data) {
            let colors = [];
            for (var i = 0; i < colors_in.length; i++) {
                let color = colors_in[i];
                colors[i] = exists(color) ? color : "";
            }
            if (!colors.every((e) => e === "")) {
                while (colors[colors.length - 1] === "") {
                    colors.splice(-1, 1);
                }
                data.Colors = colors;
            }

            let outlines = [];
            for (var i = 0; i < outlines_in.length; i++) {
                let color = outlines_in[i];
                outlines[i] = exists(color) ? color : "";
            }
            if (!outlines.every((e) => e === "")) {
                while (outlines[outlines.length - 1] === "") {
                    outlines.splice(-1, 1);
                }
                data.Outlines = outlines;
            }
        },
        ExportBlock: function(origin, data) {
            if (!exists(origin)) {
                return;
            }

            if (exists(origin.Type) && origin.Type !== 0) {
                data.Type = origin.Type;
            }
            if (exists(origin.Pattern) && origin.Pattern !== 0) {
                data.Pattern = origin.Pattern;
            }

            this.ExportColorArray(origin.Colors,
                origin.Outlines,
                data);
        },
        SetTab: async function(tab) {
            let pills = document.querySelector('ul.nav-pills');
            let hrefs = pills.querySelectorAll('a');
            if (typeof(tab) == "string") {
                tab = tab.toLowerCase();

                for (var i = 0; i < hrefs.length; i++) {
                    if (hrefs[i].querySelector("span").innerHTML.search(tab) != -1) {
                        tab = i;
                        break;
                    }
                }
                if (!exists(i)) { return; }
            }
            if (hrefs[tab].className.search("active") == -1) {
                hrefs[tab].dispatchEvent(clickEvent);
            }

            await Character.SetupFunctions();
        },
        GetTab: function() {
            let pills = document.querySelector('ul.nav-pills');
            let hrefs = pills.querySelectorAll('a');

            for (var i = 0; i < hrefs.length; i++) {
                if (hrefs[i].className.search("active") != -1) {
                    return i;
                }
            }
        }
    };

    var Character = {
        FunctionsSet: false,
        SetupFunctions: async function() {
            for (let i in this.IOFunctions) {
                let v = this.IOFunctions[i];
                if (v.Tab === Utils.GetTab()) {
                    this.TabData = await v.SetupFunctions(document);
                    console.log(this.TabData);
                    return;
                }
            }
            Character.TabData = null;
        },
        IOFunctions: [{
                PrintName: "Body",
                Tab: 0,
                Import: async function(data, tabdata) {
                    tabdata.Color = exists(data.Color) ? data.Color : "ffffff";
                    tabdata.Outline = exists(data.Outline) ? data.Outline : "000000";

                    // Horn.
                    Utils.ImportBlock(data.Horn, tabdata.Horn);

                    // Wings.
                    Utils.ImportBlock(data.Wings, tabdata.Wings);

                    // Ears.
                    Utils.ImportBlock(data.Ears, tabdata.Ears)

                    // Front hooves.
                    Utils.ImportBlock(data.FrontHooves, tabdata.FrontHooves);

                    // Back hooves.
                    Utils.ImportBlock(data.BackHooves, tabdata.BackHooves);

                    // Buttmark
                    tabdata.Buttmark = data.Buttmark;
                    tabdata.FlipButtmark = exists(data.FlipButtmark) ? data.FlipButtmark : false;
                },
                Export: async function(tabdata) {
                    let exported = {};

                    if (tabdata.GetCustomOutlines()) {
                        exported.OutlinesEnabled = tabdata.GetCustomOutlines();
                    }
                    if (tabdata.Color !== "ffffff") {
                        exported.Color = tabdata.Color;
                    }
                    if (exists(tabdata.Outline) && tabdata.Outline !== "000000") {
                        exported.Outline = tabdata.Outline;
                    }

                    // Horn
                    if (tabdata.Horn.Type > 0) {
                        Utils.ExportBlock(tabdata.Horn, exported.Horn = {});
                    }

                    // Wings
                    if (tabdata.Wings.Type > 0) {
                        Utils.ExportBlock(tabdata.Wings, exported.Wings = {});
                    }

                    // Ears
                    if (tabdata.Ears.Type > 0) {
                        Utils.ExportBlock(tabdata.Ears, exported.Ears = {});
                    }

                    // Front hooves
                    if (tabdata.FrontHooves.Type > 0) {
                        Utils.ExportBlock(tabdata.FrontHooves, exported.FrontHooves = {});
                    }

                    // Back hooves
                    if (tabdata.BackHooves.Type > 0) {
                        Utils.ExportBlock(tabdata.BackHooves, exported.BackHooves = {});
                    }

                    // Buttmark
                    let mark = tabdata.Buttmark;
                    if (!mark.every((e) => e === "")) {
                        exported.Buttmark = mark;
                    }
                    if (tabdata.FlipButtmark) {
                        exported.FlipButtmark = true;
                    }

                    return exported;
                },
                GetButtmark: function(container) {
                    let element = container.querySelector("bitmap-box");
                    if (element.tagName == "BITMAP-BOX") {
                        element = element.children[0];

                        let pixels = [];

                        let rows = element.children;

                        let rgb2hex = function(rgb) {
                            if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;

                            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

                            function hex(x) {
                                return ("0" + parseInt(x).toString(16)).slice(-2);
                            }
                            return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
                        };

                        let count = 0;
                        for (var i = 0; i < rows.length; i++) {
                            let bits = rows[i].children;
                            for (var j = 0; j < rows.length; j++) {
                                pixels[count++] = bits[j].style.backgroundColor !== "" ? rgb2hex(bits[j].style.backgroundColor) : "";
                            }
                        }
                        return pixels;
                    }
                },
                SetButtmark: function(container, pixels) {
                    let element = container.querySelector("bitmap-box");
                    if (exists(element)) {
                        element = element.children[0];

                        Utils.EraseButtmark();

                        if (!exists(pixels)) { return; }
                        if (pixels.every((e) => e === "")) { return; }

                        Utils.PickBrush();

                        let rows = element.children;
                        let count = 0;
                        for (var i = 0; i < rows.length; i++) {
                            let bits = rows[i].children;
                            for (var j = 0; j < rows.length; j++) {
                                if (pixels[count] !== "") {
                                    Utils.SetPixel(bits[j], pixels[count]);
                                }
                                count++;
                            }
                        }
                        return pixels;
                    }
                },
                SetupFunctions: async function(container) {
                    let setup = {};

                    let tab = container.querySelector('[heading="body"]');
                    let checkboxes = tab.querySelectorAll('check-box');
                    let colorpickers = tab.querySelectorAll('color-picker');

                    checkboxes[0].addEventListener("click", Character.OutlineChanged, true);
                    setup.SetCustomOutlines = (value) => {
                        Utils.SetCheckbox(checkboxes[0], value);
                    };

                    setup.GetCustomOutlines = () => {
                        return Utils.IsCheckboxChecked(checkboxes[0]);
                    }

                    Utils.DefineColorPicker(setup, "Color", colorpickers[0]);
                    Utils.DefineColorPicker(setup, "Outline", colorpickers[1]);

                    Utils.DefineSet(tab, "Horn", setup.Horn = {});
                    Utils.DefineSet(tab, "Wings", setup.Wings = {});
                    Utils.DefineSet(tab, "Ears", setup.Ears = {});
                    Utils.DefineSet(tab, "Front hooves", setup.FrontHooves = {});
                    Utils.DefineSet(tab, "Back hooves", setup.BackHooves = {});

                    let io = this;
                    Object.defineProperty(setup, "Buttmark", {
                        get: function() {
                            return io.GetButtmark(tab);
                        },
                        set: function(value) {
                            io.SetButtmark(tab, value);
                            return true;
                        }
                    });

                    let labels = document.querySelectorAll("label");
                    let flip_checkbox = [].filter.call(labels, function(element) {
                        return element.innerHTML.search("don't") != -1;
                    })[0].parentNode.querySelector("check-box");

                    Utils.DefineCheckbox(setup, "FlipButtmark", flip_checkbox);

                    return setup;
                }
            },
            {
                PrintName: "Mane",
                Tab: 1,
                Import: async function(data, tabdata) {
                    Utils.ImportBlock(data.Mane, tabdata.Mane);
                    Utils.ImportBlock(data.Backmane, tabdata.Backmane);
                },
                Export: async function(tabdata) {
                    let exported = {};

                    if (tabdata.Mane.Type > 0) {
                        Utils.ExportBlock(tabdata.Mane, exported.Mane = {});
                    }

                    if (tabdata.Backmane.Type > 0) {
                        Utils.ExportBlock(tabdata.Backmane, exported.Backmane = {});
                    }

                    return exported;
                },
                SetupFunctions: async function(container) {
                    let setup = {};
                    let tab = container.querySelector('[heading="mane"]');

                    Utils.DefineSet(tab, "Mane", setup.Mane = {});
                    Utils.DefineSet(tab, "Back mane", setup.Backmane = {});

                    return setup;
                }
            },
            {
                PrintName: "Tail",
                Tab: 2,
                Import: async function(data, tabdata) {
                    Utils.ImportBlock(data.Tail, tabdata.Tail);
                },
                Export: async function(tabdata) {
                    let exported = {};

                    if (tabdata.Tail.Type > 0) {
                        Utils.ExportBlock(tabdata.Tail, exported.Tail = {});
                    }

                    return exported;
                },
                SetupFunctions: async function(container) {
                    let setup = {};

                    let tab = container.querySelector('[heading="tail"]');

                    Utils.DefineSet(tab, "Tail", setup.Tail = {});

                    return setup;
                }
            },
            {
                PrintName: "Face",
                Tab: 3,
                Import: async function(data, tabdata) {
                    tabdata.EyeColor = exists(data.EyeColor) ? data.EyeColor : "000000";
                    tabdata.EyeColorLeft = exists(data.EyeColorLeft) ? data.EyeColorLeft : null;
                    tabdata.EyeWhitesColor = exists(data.EyeWhitesColor) ? data.EyeWhitesColor : "ffffff";

                    tabdata.Eyes = exists(data.Eyes) ? data.Eyes : 0;
                    tabdata.LeftEye = exists(data.LeftEye) ? data.LeftEye : null;

                    tabdata.Eyeshadow = exists(data.Eyeshadow) ? data.Eyeshadow : null;
                    tabdata.Eyelashes = exists(data.Eyelashes) ? data.Eyelashes : 0;

                    tabdata.Expression = exists(data.Expression) ? data.Expression : 0;
                    tabdata.Fangs = exists(data.Fangs) ? data.Fangs : 0;

                    if (exists(data.Markings)) {
                        console.log(tabdata.Markings);
                        tabdata.Markings = exists(data.Markings) ? data.Markings : 0;
                        tabdata.MarkingsColor = exists(data.MarkingsColor) ? data.MarkingsColor : 0;

                        console.log(data);
                        console.log(tabdata);
                    } else {
                        tabdata.Markings = 0;
                    }

                    Utils.ImportBlock(data.FacialHair, tabdata.FacialHair);

                    Utils.ImportBlock(data.Muzzle, tabdata.Muzzle);
                },
                Export: async function(tabdata) {
                    let exported = {};

                    if (tabdata.EyeColor !== "000000") {
                        exported.EyeColor = tabdata.EyeColor;
                    }

                    if (exists(tabdata.EyeColorLeft)) {
                        exported.EyeColorLeft = tabdata.EyeColorLeft;
                    }

                    if (tabdata.EyeWhitesColor !== "ffffff") {
                        exported.EyeWhitesColor = tabdata.EyeWhitesColor;
                    }

                    if (tabdata.Eyes !== 0) {
                        exported.Eyes = tabdata.Eyes;
                    }

                    if (exists(tabdata.LeftEye)) {
                        exported.LeftEye = tabdata.LeftEye;
                    }

                    if (exists(tabdata.Eyeshadow)) {
                        exported.Eyeshadow = tabdata.Eyeshadow;
                    }

                    if (tabdata.Eyelashes > 0) {
                        exported.Eyelashes = tabdata.Eyelashes;
                    }

                    let muzzle = {};
                    Utils.ExportBlock(tabdata.Muzzle, muzzle);
                    if (Object.keys(muzzle).length > 0) {
                        exported.Muzzle = muzzle;
                    }

                    if (tabdata.Expression > 0) {
                        exported.Expression = tabdata.Expression;
                    }

                    if (tabdata.Fangs > 0) {
                        exported.Fangs = tabdata.Fangs;
                    }

                    if (tabdata.Markings > 0) {
                        exported.Markings = tabdata.Markings;
                        exported.MarkingsColor = tabdata.MarkingsColor;
                    }

                    if (tabdata.FacialHair.Type > 0) {
                        Utils.ExportBlock(tabdata.FacialHair, exported.FacialHair = {});
                    }

                    return exported;
                },
                SetupFunctions: async function(container) {
                    let setup = {};
                    let tab = container.querySelector('[heading="face"]');
                    let tab_elements = tab.children[0].children[0].children;

                    let n = 0;

                    // 1. Eye color.
                    Utils.DefineColorPicker(setup, "EyeColor", tab_elements[n++].querySelector("color-picker"));

                    // 2. Left eye color.
                    Utils.DefineColorPicker(setup, "LeftEyeColor", tab_elements[n++].querySelector("color-picker"));

                    // 3. Eye whites color.
                    Utils.DefineColorPicker(setup, "EyeWhitesColor", tab_elements[n++].querySelector("color-picker"));

                    // 4. Eyes (Right). It wouldn't be tricky without that.
                    let right_eye_selection = tab_elements[n++].querySelector("sprite-selection");
                    Utils.DefineSpriteSelection(setup, "Eyes", right_eye_selection);
                    Utils.DefineSpriteSelection(setup, "RightEye", right_eye_selection);

                    // 5. Eye (Left).
                    let right_eye_checkbox = right_eye_selection.parentNode.parentNode.querySelector("check-box");
                    let get_left_eye_selector = function() {
                        let elements = tab.children[0].children[0].children;
                        let div = null;
                        for (var i = 0; i < elements.length; i++) {
                            if (elements[i] == right_eye_selection.parentNode.parentNode) {
                                return elements[i + 1].querySelector("sprite-selection");
                            }
                        }
                    };
                    Object.defineProperty(setup, "LeftEye", {
                        get: function() {
                            if (!Utils.IsCheckboxChecked(right_eye_checkbox)) {
                                return Utils.GetSelectedSprite(get_left_eye_selector());
                            }
                        },
                        set: function(value) {
                            if (value === null) {
                                Utils.SetCheckbox(right_eye_checkbox, true);
                                return true;
                            }

                            Utils.SetCheckbox(right_eye_checkbox, false);
                            return Utils.SetSelectedSprite(get_left_eye_selector(), value);
                            return true;
                        }
                    });

                    // We'll go from the end now.
                    n = tab_elements.length - 1;

                    // 14. Facial hair
                    n--;

                    // 13. HR.
                    n--;

                    // 12. Markings color.
                    Utils.DefineColorPicker(setup, "MarkingsColor", tab_elements[n--].querySelector("color-picker"));

                    // 12. Markings.
                    Utils.DefineSpriteSelection(setup, "Markings", tab_elements[n--].querySelector("sprite-selection"));

                    // 11. Fangs.
                    Utils.DefineSpriteSelection(setup, "Fangs", tab_elements[n--].querySelector("sprite-selection"));

                    // 10. Expression.
                    Utils.DefineSpriteSelection(setup, "Expression", tab_elements[n--].querySelector("sprite-selection"));

                    // 9. Muzzle.
                    n--;

                    // 8. HR.
                    n--;

                    // 7. Eyelashes.
                    Utils.DefineSpriteSelection(setup, "Eyelashes", tab_elements[n--].querySelector("sprite-selection"));

                    // 6. Eyeshadow.
                    Utils.DefineColorPicker(setup, "Eyeshadow", tab_elements[n--].querySelector("color-picker"));

                    // Muzzle set
                    Utils.DefineSet(tab, "Muzzle", setup.Muzzle = {});

                    Utils.DefineSet(tab, "Facial hair", setup.FacialHair = {});

                    return setup;
                }
            },
            {
                Container: null,
                PrintName: "Other",
                Tab: 4,
                IOFunctions: [{
                        PrintName: "Head",
                        Tab: 0,
                        Import: async function(data, tabdata) {
                            Utils.ImportBlock(data.HeadAccessories, tabdata.HeadAccessories);
                            Utils.ImportBlock(data.EarAccessories, tabdata.EarAccessories);
                            Utils.ImportBlock(data.FaceAccessories, tabdata.FaceAccessories);
                        },
                        Export: async function(tabdata) {
                            let exported = {};

                            if (tabdata.HeadAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.HeadAccessories, exported.HeadAccessories = {});
                            }
                            if (tabdata.EarAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.EarAccessories, exported.EarAccessories = {});
                            }
                            if (tabdata.FaceAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.FaceAccessories, exported.FaceAccessories = {});
                            }

                            return exported;
                        },
                        SetupFunctions: async function(container) {
                            let setup = {};

                            let tab = container.querySelector('[heading="head"]');

                            Utils.DefineSet(tab, "Head accessories", setup.HeadAccessories = {});
                            Utils.DefineSet(tab, "Ear accessories", setup.EarAccessories = {});
                            Utils.DefineSet(tab, "Face accessories", setup.FaceAccessories = {});

                            return setup;
                        }
                    },
                    {
                        PrintName: "Neck",
                        Tab: 1,
                        Import: async function(data, tabdata) {
                            Utils.ImportBlock(data.NeckAccessories, tabdata.NeckAccessories);
                        },
                        Export: async function(tabdata) {
                            let exported = {};

                            if (tabdata.NeckAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.NeckAccessories, exported.NeckAccessories = {});
                            }

                            return exported;
                        },
                        SetupFunctions: async function(container) {
                            let setup = {};
                            let tab = container.querySelector('[heading="neck"]');

                            Utils.DefineSet(tab, "Neck accessories", setup.NeckAccessories = {});

                            return setup;
                        }
                    },
                    {
                        PrintName: "Legs",
                        Tab: 2,
                        Import: async function(data, tabdata) {
                            let same_legs = exists(data.SameBackLegs) ? data.SameBackLegs : true;
                            await tabdata.SetSameBackLegs(same_legs);
                            Utils.ImportBlock(data.FrontLegAccessories, tabdata.FrontLegAccessories);

                            if (!same_legs) {
                                Utils.ImportBlock(data.BackLegAccessories, tabdata.BackLegAccessories);
                            }
                        },
                        Export: async function(tabdata) {
                            let exported = {};

                            if (tabdata.FrontLegAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.FrontLegAccessories, exported.FrontLegAccessories = {});
                            }

                            if (!tabdata.GetSameBackLegs()) {
                                exported.SameBackLegs = false;
                            }

                            if (!tabdata.GetSameBackLegs()) {
                                if (tabdata.BackLegAccessories.Type > 0) {
                                    Utils.ExportBlock(tabdata.BackLegAccessories, exported.BackLegAccessories = {});
                                }
                            }

                            return exported;
                        },
                        SetupFunctions: async function(container) {
                            let setup = {};

                            let tab = container.querySelector('[heading="legs"]');

                            Utils.DefineSet(tab, "Front leg accessories", setup.FrontLegAccessories = {});

                            let same_back_legs = tab.querySelector("div").querySelector("div:scope > div > div > check-box");
                            Utils.DefineCheckbox(setup, "SameBackLegs", same_back_legs);

                            setup.SetSameBackLegs = (value) => {
                                Utils.SetCheckbox(same_back_legs, value);

                                return new Promise(function(resolve) {
                                    resolve();
                                }).then(() => {
                                    if (!value) {
                                        Utils.DefineSet(tab, "Back leg accessories", setup.BackLegAccessories = {});
                                    } else {
                                        setup.BackLegAccessories = null;
                                    }
                                });
                            };

                            setup.GetSameBackLegs = () => {
                                return Utils.IsCheckboxChecked(same_back_legs);
                            };

                            if (!Utils.IsCheckboxChecked(same_back_legs)) {
                                Utils.DefineSet(tab, "Back leg accessories", setup.BackLegAccessories = {});
                            }

                            return setup;
                        }
                    },
                    {
                        Container: null,
                        PrintName: "Chest",
                        Tab: 3,
                        Import: async function(data, tabdata) {
                            Utils.ImportBlock(data.ChestAccessories, tabdata.ChestAccessories);

                            // I know.
                            if (tabdata.ChestAccessories.Type > 1) {
                                let tab = this.Container.querySelector('[heading="chest"]');
                                let tabdata = {};
                                Utils.DefineSet(tab, "Sleeves", tabdata.Sleeves = {}, true);

                                Utils.ImportBlock(data.Sleeves, tabdata.Sleeves);
                            }
                        },
                        Export: async function(tabdata) {
                            let exported = {};

                            if (tabdata.ChestAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.ChestAccessories, exported.ChestAccessories = {});
                                if (tabdata.ChestAccessories.Type > 1) {
                                    Utils.ExportBlock(tabdata.Sleeves, exported.Sleeves = {});
                                }
                            }

                            return exported;
                        },
                        SetupFunctions: async function(container) {
                            this.Container = container;

                            let setup = {};
                            let tab = container.querySelector('[heading="chest"]');

                            Utils.DefineSet(tab, "Chest accessories", setup.ChestAccessories = {});
                            Utils.DefineSet(tab, "Sleeves", setup.Sleeves = {}, true);

                            return setup;
                        }
                    },
                    {
                        PrintName: "Back",
                        Tab: 4,
                        Import: async function(data, tabdata) {
                            Utils.ImportBlock(data.BackAccessories, tabdata.BackAccessories);
                        },
                        Export: async function(tabdata) {
                            let exported = {};

                            if (tabdata.BackAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.BackAccessories, exported.BackAccessories = {});
                            }
                            return exported;
                        },
                        SetupFunctions: async function(container) {
                            let setup = {};
                            let tab = container.querySelector('[heading="back"]');

                            Utils.DefineSet(tab, "Back accessories", setup.BackAccessories = {});

                            return setup;
                        }
                    },
                    {
                        PrintName: "Waist",
                        Tab: 5,
                        Import: async function(data, tabdata) {
                            Utils.ImportBlock(data.WaistAccessories, tabdata.WaistAccessories);
                        },
                        Export: async function(tabdata) {
                            let exported = {};

                            if (tabdata.WaistAccessories.Type > 0) {
                                Utils.ExportBlock(tabdata.WaistAccessories, exported.WaistAccessories = {});
                            }

                            return exported;
                        },
                        SetupFunctions: async function(container) {
                            let setup = {};
                            let tab = container.querySelector('[heading="waist"]');

                            Utils.DefineSet(tab, "Waist accessories", setup.WaistAccessories = {});

                            return setup;
                        }
                    },
                    {
                        PrintName: "Other",
                        Tab: 6,
                        Import: async function(data, tabdata) {
                            Utils.ImportBlock(data.ExtraAccessories, tabdata.ExtraAccessories);
                        },
                        Export: async function(tabdata) {
                            let exported = {};

                            let extra = {}
                            Utils.ExportBlock(tabdata.ExtraAccessories, extra);
                            if (Object.keys(extra).length > 0) {
                                exported.ExtraAccessories = extra;
                            }

                            return exported;
                        },
                        SetupFunctions: async function(container) {
                            let setup = {};
                            let tab = container.querySelector('[heading="other"]');

                            Utils.DefineSet(tab, "Extra accessories", setup.ExtraAccessories = {});

                            return setup;
                        }
                    }
                ],
                Import: async function(data, tabdata) {
                    let exported = {};

                    for (let i in this.IOFunctions) {
                        let v = this.IOFunctions[i];
                        // console.log("> Importing tab #" + i + " (" + v.PrintName + ")...");
                        await this.SetTab(v.Tab);

                        let localdata = exists(data[v.PrintName]) ? data[v.PrintName] : {};
                        let tabdata = Character.TabData;
                        await v.Import(localdata, tabdata);
                    }

                    return exported;
                },
                Export: async function(tabdata) {
                    let exported = {};
                    for (var i in this.IOFunctions) {
                        let v = this.IOFunctions[i];
                        // console.log("> Exporting tab #" + i + " (" + v.PrintName + ")...");
                        await this.SetTab(v.Tab);

                        let tabdata = Character.TabData;

                        let data = await v.Export(tabdata);
                        if (Object.keys(data).length > 0) {
                            exported[v.PrintName] = data;
                        }
                    }
                    return exported;
                },
                SetTab: async function(tab) {
                    if (!exists(this.Container)) { return; }

                    let pills = this.Container.querySelector("ul.nav-tabs");
                    let hrefs = pills.querySelectorAll('a');
                    if (typeof(tab) == "string") {
                        tab = tab.toLowerCase();

                        let i;
                        for (i = 0; i < hrefs.length; i++) {
                            if (hrefs[i].querySelector("span").innerHTML.search(tab) != -1) {
                                tab = i;
                                break;
                            }
                        }

                        if (!exists(i)) { return; }
                    }
                    if (hrefs[tab].className.search("active") == -1) {
                        hrefs[tab].dispatchEvent(clickEvent);
                    }

                    await Character.SetupFunctions();
                },
                GetTab: async function() {
                    if (!exists(this.Container)) { return; }

                    let pills = this.Container.querySelector("ul.nav-tabs");
                    let hrefs = pills.querySelectorAll('a');

                    for (var i = 0; i < hrefs.length; i++) {
                        if (hrefs[i].className.search("active") != -1) {
                            return i;
                        }
                    }
                },
                SetupFunctions: async function(container) {
                    let tab = container.querySelector('[heading="other"]');
                    this.Container = container;
                    let current_tab = await this.GetTab();
                    for (let i in this.IOFunctions) {
                        let v = this.IOFunctions[i];

                        if (v.Tab === current_tab) {
                            return await v.SetupFunctions(tab);
                        }
                    }
                }
            }
        ],
        Export: async function() {
            let data = {};

            for (var i in Character.IOFunctions) {
                let v = Character.IOFunctions[i];
                // console.log("Exporting tab #" + i + " (" + v.PrintName + ")...");
                await Utils.SetTab(v.Tab);

                let tabdata = Character.TabData;

                let exported = await v.Export(tabdata);
                if (Object.keys(exported).length > 0) {

                    data[v.PrintName] = exported;
                }
            }
            await Utils.SetTab(0);

            return data;
        },
        Import: async function(data) {
            data = JSON.parse(data);
            data.Body = exists(data.Body) ? data.Body : {};

            await Utils.SetTab(0);
            await Sleep(250);
            let outlines_enabled = exists(data.Body.OutlinesEnabled) ? data.Body.OutlinesEnabled : false;
            await Character.TabData.SetCustomOutlines(outlines_enabled);

            for (var i in Character.IOFunctions) {
                let v = Character.IOFunctions[i];
                // console.log("Importing tab #" + i + " (" + v.PrintName + ")...");
                await Utils.SetTab(v.Tab);


                let localdata = exists(data[v.PrintName]) ? data[v.PrintName] : {};
                let tabdata = Character.TabData;
                await v.Import(localdata, tabdata);
            }
            await Utils.SetTab(0);
        }
    };

    var UI = {
        InjectedCSSTag: null,
        ImportDialog: null,
        ExportDialog: null,
        Overlay: null,
        Style: `
		.nmw-ie-fullscreen{align-items:center;background:rgba(51,51,51,0.7);display:flex;height:100%;left:0;position:fixed;top:0;width:100%;z-index:1}
		.nmw-ie-fullscreen .form{background:#212121;border:4px solid #CA7E4E;border-radius:25px;display:inline-block;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;left:50%;margin:0 auto;padding-left:.5rem;padding-right:.5rem;position:static;top:50%;vertical-align:middle;width:50%}
		.nmw-ie-fullscreen .form .footer{height:16px;width:100%}
		.nmw-ie-fullscreen .form .footer .elements{float:right;height:16px;line-height:16px;margin-bottom:.5rem;margin-top:.5rem}
		.nmw-ie-fullscreen .form .footer .elements .link{display:inline;fill:#1da1f2;text-decoration:none}
		.nmw-ie-fullscreen .form .footer .elements .text{color:#CA7E4E!important;display:inline;font-size:.75em}
		.nmw-ie-fullscreen .form .header{color:#888!important;display:block;font-size:1.25em;font-weight:700;line-height:150%;margin-top:.25rem;text-align:center}
		.nmw-ie-fullscreen .form .text{color:#CCC!important;display:block;font-size:1.25em;font-weight:700;text-align:center}
		.nmw-ie-fullscreen .form .textarea{display:block;height:60%;line-height:150%;margin-left:auto;margin-right:auto;width:100%}
		.nmw-ie-fullscreen .form .warning{color:#CA7E4E!important;display:block;font-size:1em;font-weight:700;line-height:150%;text-align:center}
		.nmw-ie-fullscreen .form button{color:#FFF!important;display:block;font-size:1em;font-weight:700;height:5%;margin-left:auto;margin-right:auto;width:100%}
		.nmw-ie-fullscreen .form hr{border:0;border-top:1px solid #555;margin-bottom:.5rem;margin-top:.5rem}
		`,
        ImportHTMLCode: `
		<label class="header">Import character</label>
		<hr/>
		<textarea class="textarea" cols="40" rows="5"></textarea>
		<hr/>
		<label class="text">Paste your character code inside and press Import.</label>
		<label class="warning">
		Careful! This will erase current character settings.
		</label>
		<button class="btn btn-primary">Import</button>
		<hr/>`,
        ExportHTMLCode: `
		<label class="header">Exported character</label>
		<hr/>
		<textarea readonly class="textarea" cols="40" rows="5"></textarea>
		<hr/>
		<label class="text">Press Ctrl+C to copy.</label>
		<hr/>
		<label class="text">Now copy and paste this code somewhere.</label>
		<button class="btn btn-primary">Dismiss</button>
		`,
        FooterHTMLCode: `
		<div class="footer">
			<div class="elements">
				<label class="text">Import/Export © NotMyWing, PT © Agamnentzar</label>
				<a target="_blank" href="https://twitter.com/NotMyWing" class="link">
					<svg width="16" height="16" viewBox="0 0 72 72"><path fill-rule="evenodd" d="M67.812 16.141a26.246 26.246 0 0 1-7.519 2.06 13.134 13.134 0 0 0 5.756-7.244 26.127 26.127 0 0 1-8.313 3.176A13.075 13.075 0 0 0 48.182 10c-7.229 0-13.092 5.861-13.092 13.093 0 1.026.118 2.021.338 2.981-10.885-.548-20.528-5.757-26.987-13.679a13.048 13.048 0 0 0-1.771 6.581c0 4.542 2.312 8.551 5.824 10.898a13.048 13.048 0 0 1-5.93-1.638c-.002.055-.002.11-.002.162 0 6.345 4.513 11.638 10.504 12.84a13.177 13.177 0 0 1-3.449.457c-.846 0-1.667-.078-2.465-.231 1.667 5.2 6.499 8.986 12.23 9.09a26.276 26.276 0 0 1-16.26 5.606A26.21 26.21 0 0 1 4 55.976a37.036 37.036 0 0 0 20.067 5.882c24.083 0 37.251-19.949 37.251-37.249 0-.566-.014-1.134-.039-1.694a26.597 26.597 0 0 0 6.533-6.774z"></path></svg>
				</a>
				<a target="_blank" href="https://github.com/Neeve01" class="link">
					<svg width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
				</a>
			</div>
		</div>
		`,
        InjectHTML: function() {
            if (!exists(this.InjectedCSSTag)) {
                let head = document.querySelector("head");
                let css = this.InjectedCSSTag = document.createElement("style");
                css.type = "text/css";
                css.innerHTML = this.Style;

                head.appendChild(css);
            }

            if (!exists(this.Overlay)) {
                let body = document.querySelector("body");
                let e = this.Overlay = document.createElement("div");
                e.style.display = 'none';
                e.classList.add("nmw-ie-fullscreen");

                body.appendChild(e);
            }

            if (!exists(this.ImportDialog)) {
                let e = this.ImportDialog = document.createElement("div");
                e.style.display = 'none';
                e.classList.add("form");
                e.innerHTML = this.ImportHTMLCode + this.FooterHTMLCode;

                let button = e.querySelector("button");
                button.onclick = function() { UI.StartImporting(); };

                let textarea = this.ImportDialog.querySelector("textarea");
                textarea.onkeypress = function(ev) {
                    if (ev.keyCode == 10 || (ev.ctrlKey && ev.keyCode == 13)) {
                        UI.StartImporting();
                    }
                };
                this.Overlay.appendChild(e);
            }

            if (!exists(this.ExportDialog)) {
                let e = this.ExportDialog = document.createElement("div");
                e.style.display = 'none';
                e.classList.add("form");
                e.innerHTML = this.ExportHTMLCode + this.FooterHTMLCode;

                let textarea = this.ExportDialog.querySelector("textarea");
                textarea.onclick = function() {
                    textarea.focus();
                    textarea.select();
                };

                let button = e.querySelector("button");
                button.onclick = function() {
                    UI.HideForms();
                    UI.HideOverlay();
                }

                this.Overlay.appendChild(e);
            }
        },
        ShowImport: function() {
            this.InjectHTML();

            this.Overlay.style.display = "flex";
            this.ImportDialog.style.display = "inline-block";

            let textarea = this.ImportDialog.querySelector("textarea");
            textarea.value = "";
            textarea.focus();
        },
        ShowExport: async function() {
            this.InjectHTML();

            this.Overlay.style.display = "flex";

            await Sleep(250);
            this.ExportDialog.style.display = "table-cell";
            let textarea = this.ExportDialog.querySelector("textarea");
            textarea.value = "";
            await Sleep(0);
            let data = null;
            try {
                data = JSON.stringify(await Character.Export());
            } catch (err) {
                this.HideForms();
                this.HideOverlay();
                throw err;
            }

            textarea.value = data;
            textarea.focus();
            textarea.setSelectionRange(0, textarea.value.length);
        },
        StartImporting: async function() {
            let textarea = this.ImportDialog.querySelector("textarea");

            try {
                this.HideForms();
                await Character.Import(textarea.value);
            } catch (err) {
                this.HideForms();
                this.HideOverlay();
                throw err;
            }

            this.HideOverlay();
        },
        HideForms: function() {
            this.ImportDialog.style.display = "none";
            this.ExportDialog.style.display = "none";
        },
        HideOverlay: function() {
            this.Overlay.style.display = "none";
        },
    }

    // --
    //
    // Injection.
    //
    // --

    var InjectBodyTab = function() {
        if (Utils.GetTab() === 0) {
            let bodyTab = document.querySelector('[heading="body"]');

            if (bodyTab === null) return;

            bodyTab = bodyTab.childNodes[1].childNodes[0];

            bodyTab.prepend(document.createElement("hr"));

            let Form = document.createElement("div");
            Form.setAttribute("class", "row form-group");
            bodyTab.prepend(Form);

            let Description = document.createElement("div");
            Description.classList.add("col-sm-4");
            let Label = document.createElement("label");
            Label.setAttribute("class", "control-label");
            Label.innerHTML = "Import / Export";
            Form.append(Description);
            Description.append(Label);

            let FormBody = document.createElement("div");
            FormBody.setAttribute("class", "col-sm-8");
            Form.append(FormBody);

            let ButtonGroup = document.createElement("div");
            //ButtonGroup.setAttribute("class", "btn-groupa");
            let Import = document.createElement("label");
            Import.setAttribute("class", "btn btn-primary");
            Import.innerHTML = "Import";
            Import.onclick = function() { UI.ShowImport(); };

            let Export = document.createElement("label");
            Export.setAttribute("class", "btn btn-primary");
            Export.innerHTML = "Export";
            Export.onclick = function() { UI.ShowExport(); };
            ButtonGroup.append(Import);
            ButtonGroup.append(Export);
            FormBody.append(ButtonGroup);

            let version = document.querySelector("footer.app-footer > div.clearfix > div.float-left.text-muted.text-nowrap");
            if (!exists(version) || (exists(version.children[0]) && version.children[0].innerHTML != targetPonyTownVersion)) {
                let div = document.createElement("div");
                div.innerHTML = "Careful! I/E wasn't tested to work with current version.";

                let anchor = document.createElement("a");
                anchor.setAttribute("target", "_blank");
                anchor.setAttribute("href", githubScriptLink);
                anchor.innerHTML = "Click here to check for updates.";

                div.appendChild(document.createElement("br"));
                div.appendChild(anchor);
                FormBody.appendChild(div);
            } else {
                console.log("version is ok");
            }

            bodyTab.prepend(document.createElement("br"));
        }
    };

    // Set observer.
    var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            let element = mutations[i].target;
            if (mutations[i].removedNodes.length === 0 && element.tagName == "TAB") {
                if (exists(element.getAttribute("heading")) && element.className.search("active") != 1) {
                    let pills = document.querySelector('ul.nav-pills');
                    let hrefs = pills.querySelectorAll('a');

                    InjectBodyTab();
                    return;
                }
            }
        }
    });
    observer.observe(observer_target, {
        childList: true,
        subtree: true
    });
})();