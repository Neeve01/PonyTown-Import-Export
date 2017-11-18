// ==UserScript==
// @name        PonyTown Import/Export
// @namespace   azedith
// @include     https://pony.town/*
// @author	@NotMyWing
// @version     1
// @grant       none
// @downloadURL	https://github.com/Neeve01/PonyTown-Import-Export/raw/master/PonyTown_IE.user.js
// ==/UserScript==

(function() {
    'use strict';

    var debugging = false;

    var targetPonyTownVersion = "0.28.4-alpha";
    var githubLink = "https://github.com/Neeve01";
    var twitterLink = "https://twitter.com/NotMyWing";
    var githubScriptLink = "https://github.com/Neeve01/PonyTown-Import-Export";

    var clickEvent = new Event('click');
    var inputEvent = new Event('input');
    var mousedownEvent = new Event('mousedown');
    var mouseupEvent = new Event('mouseup');

    var debug = function(a) {
        if (debugging) {
            console.log(a);
        }
    }
    var rgb2hex = function(rgb) {
        if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;

        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    };

    var Sleep = function(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time);
        });
    };

    var skipFrame = async function() {
        return new Promise(function(resolve) {
            resolve();
        });
    }

    var observer_target = document.querySelector("pony-town-app");

    if (!observer_target) {
        return;
    }

    var Utils = {
        GetFillOutlineValues: function(element) {
            if (element.tagName == "FILL-OUTLINE") {
                let divs = element.querySelectorAll("fill-outline > div > div");
                let color = null,
                    outline = null;

                if (divs[0] && divs[1]) {
                    let checkbox = divs[0].querySelector("check-box");
                    if (!checkbox || (checkbox && !this.IsCheckboxChecked(checkbox))) {
                        let picker = divs[1].querySelector("color-picker");
                        color = this.GetTextValue(picker);
                    }
                }

                if (divs[2] && divs[3]) {
                    let checkbox = divs[2].querySelector("check-box");
                    if (!checkbox || (checkbox && !this.IsCheckboxChecked(checkbox))) {
                        let picker = divs[3].querySelector("color-picker");
                        outline = this.GetTextValue(picker);
                    }
                }

                return [color, outline]
            }
        },
        SetFillOutlineValues: function(element, value) {
            if (element.tagName == "FILL-OUTLINE") {
                let color = value[0] || null;
                let outline = value[1] || null;

                let divs = element.querySelectorAll("fill-outline > div > div");

                if (divs[0] && divs[1]) {
                    let checkbox = divs[0].querySelector("check-box");

                    let should_change = true;
                    if (checkbox) {
                        should_change = !!color;
                        this.SetCheckbox(checkbox, !should_change);
                    }

                    if (should_change) {
                        let picker = divs[1].querySelector("color-picker");
                        this.SetTextValue(picker, color || "FFFFFF");
                    }
                }

                if (divs[2] && divs[3]) {
                    let checkbox = divs[2].querySelector("check-box");

                    let should_change = true;
                    if (checkbox) {
                        should_change = !!outline;
                        this.SetCheckbox(checkbox, !should_change);
                    }

                    if (should_change) {
                        let picker = divs[3].querySelector("color-picker");
                        this.SetTextValue(picker, outline || "000000");
                    }
                }
            }
        },
        DefineFillOutline: function(obj, fieldname, fill_outline) {
            let utils = this;
            Object.defineProperty(obj, fieldname, {
                get: function() {
                    if (fill_outline) {
                        return utils.GetFillOutlineValues(fill_outline);
                    }
                },
                set: function(value) {
                    if (fill_outline) {
                        return utils.SetFillOutlineValues(fill_outline, value);
                    }
                    return null;
                }
            });
        },
        DefineSet: function(set, title) {
            let out = {};

            if (set.tagName != "SET-SELECTION") {
                set = set.querySelector('set-selection[label="' + title + '"]');

                if (!set) {
                    return;
                }
            }

            let sprite_selection = set.querySelectorAll('sprite-selection');

            this.DefineSpriteSelection(out, "Type", sprite_selection[0]);
            Object.defineProperty(out, "Pattern", {
                get: function() {
                    let sprite_selection = set.querySelectorAll('sprite-selection')[1];
                    if (sprite_selection) {
                        return utils.GetSelectedSprite(sprite_selection);
                    }
                },
                set: function(value) {
                    let sprite_selection = set.querySelectorAll('sprite-selection')[1];
                    if (sprite_selection) {
                        return utils.SetSelectedSprite(sprite_selection, value);
                    }
                    return null;
                }
            });

            let utils = this;
            Object.defineProperty(out, "Colors", {
                get: function() {
                    let fill_outlines = set.querySelectorAll("fill-outline");

                    let colors = [],
                        outlines = [];
                    for (let i = 0; i < fill_outlines.length; i++) {
                        let [color, outline] = utils.GetFillOutlineValues(fill_outlines[i]);
                        colors.push(color);
                        outlines.push(outline);
                    }
                    return [colors, outlines];
                },
                set: function(value) {
                    let colors = (value && value[0]) || [];
                    let outlines = (value && value[1]) || [];

                    let fill_outlines = set.querySelectorAll("fill-outline");
                    for (let i = 0; i < fill_outlines.length; i++) {
                        utils.SetFillOutlineValues(fill_outlines[i], [colors[i], outlines[i]]);
                    }
                }
            });

            return out;
        },
        LookupFormGroupByName: function(container, name) {
            let formgroups = container.querySelectorAll(".row.form-group");

            for (let i in formgroups) {
                let v = formgroups[i];
                if (!v.querySelector)
                    continue;

                let label = v.querySelector("label");
                if (label && label.innerHTML == name)
                    return v;
            }
        },
        FormGroup_DefineColorPicker: function(formgroup) {
            let utils = this,
                out = {};

            let key_div = formgroup.children[0];
            let value_div = formgroup.children[1];

            let checkbox = key_div.querySelector("check-box");

            if (checkbox) {
                let icon = checkbox.getAttribute("icon");
                let should_invert = icon == "fa-lock";

                Object.defineProperty(out, "Enabled", {
                    get: function() {
                        if (checkbox) {
                            let checked = utils.IsCheckboxChecked(checkbox);
                            return should_invert ? !checked : checked;
                        }
                    },
                    set: function(value) {
                        if (checkbox) {
                            return utils.SetCheckbox(checkbox, should_invert ? !value : value);
                        }
                        return null;
                    }
                });
            }

            let picker = value_div.querySelector("color-picker");
            if (picker) {
                Object.defineProperty(out, "Value", {
                    get: function() {
                        if (checkbox && !out.Enabled)
                            return;
                        if (picker)
                            return utils.GetTextValue(picker);
                    },
                    set: function(value) {
                        if (checkbox) {
                            if (!value)
                                return out.Enabled = false;
                            else if (!out.Enabled)
                                out.Enabled = true;
                        }
                        if (picker)
                            return utils.SetTextValue(picker, value);
                        return null;
                    }
                });
            }

            return out;
        },
        FormGroup_DefineSpriteSelection: function(formgroup) {
            let utils = this,
                out = {};

            let key_div = formgroup.children[0];
            let value_div = formgroup.children[1];

            let checkbox = key_div.querySelector("check-box");
            if (checkbox) {
                Object.defineProperty(out, "Checked", {
                    get: function() {
                        if (checkbox) {
                            return utils.IsCheckboxChecked(checkbox);
                        }
                    },
                    set: function(value) {
                        if (checkbox) {
                            return utils.SetCheckbox(checkbox, value);
                        }
                        return null;
                    }
                });
            }

            let picker = value_div.querySelector("sprite-selection");
            this.DefineSpriteSelection(out, "Type", picker);
            this.DefineSpriteSelection(out, "Value", picker);

            return out;
        },
        DefineSpriteSelection: function(obj, fieldname, picker) {
            let utils = this;
            Object.defineProperty(obj, fieldname, {
                get: function() {
                    if (picker) {
                        return utils.GetSelectedSprite(picker);
                    }
                },
                set: function(value) {
                    if (picker) {
                        return utils.SetSelectedSprite(picker, value);
                    }
                    return null;
                }
            });
        },
        DefineCheckbox: function(obj, fieldname, checkbox) {
            let utils = this;
            Object.defineProperty(obj, fieldname, {
                get: function() {
                    if (checkbox) {
                        return utils.IsCheckboxChecked(checkbox);
                    }
                },
                set: function(value) {
                    if (checkbox) {
                        return utils.SetCheckbox(checkbox, value);
                    }
                    return null;
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
                let selection = element;
                element = element.children[0].children[0];

                if (!element.querySelector("sprite-box.active")) {
                    let show_more = selection.querySelector('.selection-item-more');
                    if (show_more) {
                        show_more.parentNode.dispatchEvent(clickEvent);
                    }
                }

                if (!element.querySelector("sprite-box.active")) {
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
                    let show_more = selection.querySelector('.selection-item-more');
                    if (show_more) {
                        show_more.parentNode.dispatchEvent(clickEvent);
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
            if (element.tagName == "CHECK-BOX") {
                if (this.IsCheckboxChecked(element) != value) {
                    element.children[0].dispatchEvent(clickEvent);
                }
            }
        },
        GetTextValue: function(element) {
            if (element.tagName == "COLOR-PICKER") {
                return element.querySelector("input").value;
            }
            return element.value;
        },
        SetTextValue: function(element, value) {
            if (element.tagName == "COLOR-PICKER") {
                element = element.querySelector("input");
            }
            element.value = value;
            element.dispatchEvent(inputEvent);
        },
        ImportSet: function(source, target) {
            target.Type = (source && source.Type) || 0;
            target.Pattern = (source && source.Pattern) || 0;
            let colors = ((source && source.Colors) || []).map((e) => { if (e === "") return null; return e; });
            let outlines = ((source && source.Outlines) || []).map((e) => { if (e === "") return null; return e; });

            target.Colors = [colors, outlines];
        },
        ExportSet: function(origin) {
            if (!origin) {
                return;
            }
            let out = {};

            if (origin.Type && origin.Type !== 0) {
                out.Type = origin.Type;
            }
            if (origin.Pattern && origin.Pattern !== 0) {
                out.Pattern = origin.Pattern;
            }

            let [colors, outlines] = origin.Colors;
            while (colors.length > 0 && !colors[colors.length - 1]) {
                colors.splice(-1, 1);
            }
            if (colors.length > 0) {
                out.Colors = colors.map((e) => { if (e === null) return ""; return e; });
            }

            while (outlines.length > 0 && !outlines[outlines.length - 1]) {
                outlines.splice(-1, 1);
            }
            if (outlines.length > 0) {
                outlines = outlines.map((e) => { if (e === null) return ""; return e; })
                out.Outlines = outlines;
            }

            if (Object.keys(out).length === 0) {
                return undefined;
            }

            return out;
        }
    };

    var PonyTown = {
        SetupFunctions: async function() {
            let tab = this.GetTab();
            for (let i in TabFunctions) {
                let v = TabFunctions[i];
                if (v.Tab === tab) {
                    let container = document.querySelector("tabset > div > tab.active.tab-pane");
                    return this.TabData = await v.SetupFunctions(container);
                }
            }
            this.TabData = null;
        },
        GetTab: function() {
            // Thanks, Keu!
            return Number(localStorage["character-active-tab"]);
        },
        SetTab: async function(tab) {
            if (this.GetTab() != tab) {
                let tabset = document.querySelector(".character-tabs > tabset")
                let hrefs = tabset.querySelectorAll('tabset > ul > li.nav-item > a');

                if (hrefs[tab].className.search("active") == -1) {
                    hrefs[tab].dispatchEvent(clickEvent);
                }
            }

            return await this.SetupFunctions();
        },
        GetAccessoryTab: function() {
            return Number(localStorage["character-active-accessory-tab"]);
        },
        SetAccessoryTab: async function(tab) {
            if (this.GetTab() != 4) { return; }
            if (this.GetAccessoryTab() != tab) {
                let tabset = document.querySelector("[active='activeAccessoryTab']");
                let hrefs = tabset.querySelectorAll('tabset > ul > li.nav-item > a');

                if (hrefs[tab].className.search("active") == -1) {
                    hrefs[tab].dispatchEvent(clickEvent);
                }
            }
            return await this.SetupFunctions();
        },
    }

    var TabFunctions = {
        ["Body"]: {
            Tab: 0,
            Import: async function(data, tabdata) {
                tabdata.BodyColors = [data.Color, data.Outline];

                // Horn.
                Utils.ImportSet(data.Horn, tabdata.Horn);

                // Wings.
                Utils.ImportSet(data.Wings, tabdata.Wings);

                // Ears.
                Utils.ImportSet(data.Ears, tabdata.Ears)

                // Front hooves.
                Utils.ImportSet(data.FrontHooves, tabdata.FrontHooves);

                // Back hooves.
                Utils.ImportSet(data.BackHooves, tabdata.BackHooves);

                // Buttmark
                tabdata.Buttmark = data.Buttmark;
                tabdata.FlipButtmark = data.FlipButtmark || false;
            },
            Export: async function(tabdata) {
                let exported = {};

                if (tabdata.CustomOutlines) {
                    exported.OutlinesEnabled = tabdata.CustomOutlines;
                }

                let [color, outline] = tabdata.BodyColors;
                if (color && color.toLowerCase() !== "ffffff") {
                    exported.Color = color;
                }
                if (outline && outline !== "000000") {
                    exported.Outline = outline;
                }

                // Horn
                if (tabdata.Horn.Type > 0) {
                    exported.Horn = Utils.ExportSet(tabdata.Horn);
                }

                // Wings
                if (tabdata.Wings.Type > 0) {
                    exported.Wings = Utils.ExportSet(tabdata.Wings);
                }

                // Ears
                if (tabdata.Ears.Type > 0) {
                    exported.Ears = Utils.ExportSet(tabdata.Ears);
                }

                // Front hooves
                if (tabdata.FrontHooves.Type > 0) {
                    exported.FrontHooves = Utils.ExportSet(tabdata.FrontHooves);
                }

                // Back hooves
                if (tabdata.BackHooves.Type > 0) {
                    exported.BackHooves = Utils.ExportSet(tabdata.BackHooves);
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

                    let count = 0;
                    for (var i = 0; i < rows.length; i++) {
                        let bits = rows[i].children;
                        for (var j = 0; j < rows.length; j++) {
                            pixels[count++] = bits[j].style.backgroundColor ? rgb2hex(bits[j].style.backgroundColor) : "";
                        }
                    }
                    return pixels;
                }
            },
            SetButtmark: function(container, pixels) {
                let element = container.querySelector("bitmap-box");
                if (element) {
                    element = element.children[0];

                    Utils.EraseButtmark();

                    if (!pixels) { return; }
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

                let checkbox = container.querySelector('check-box');

                Utils.DefineCheckbox(setup, "CustomOutlines", checkbox);
                Utils.DefineFillOutline(setup, "BodyColors", container.querySelector('[label="Body color"]'));

                setup.Horn = Utils.DefineSet(container, "Horn");
                setup.Wings = Utils.DefineSet(container, "Wings");
                setup.Ears = Utils.DefineSet(container, "Ears");
                setup.FrontHooves = Utils.DefineSet(container, "Front hooves");
                setup.BackHooves = Utils.DefineSet(container, "Back hooves");

                let io = this;
                Object.defineProperty(setup, "Buttmark", {
                    get: function() {
                        return io.GetButtmark(container);
                    },
                    set: function(value) {
                        return io.SetButtmark(container, value);
                    }
                });

                let labels = container.querySelectorAll("label");
                let flip_checkbox = [].filter.call(labels, function(element) {
                    return element.innerHTML.search("don't") != -1;
                })[0].parentNode.querySelector("check-box");

                Utils.DefineCheckbox(setup, "FlipButtmark", flip_checkbox);

                return setup;
            }
        },
        ["Mane"]: {
            Tab: 1,
            Import: async function(data, tabdata) {
                Utils.ImportSet(data.Mane, tabdata.Mane);
                Utils.ImportSet(data.Backmane, tabdata.Backmane);
            },
            Export: async function(tabdata) {
                let exported = {};

                if (tabdata.Mane.Type > 0) {
                    exported.Mane = Utils.ExportSet(tabdata.Mane);
                }

                if (tabdata.Backmane.Type > 0) {
                    exported.Backmane = Utils.ExportSet(tabdata.Backmane);
                }

                return exported;
            },
            SetupFunctions: async function(container) {
                let setup = {};

                setup.Mane = Utils.DefineSet(container, "Mane");
                setup.Backmane = Utils.DefineSet(container, "Back mane");

                return setup;
            }
        },
        ["Tail"]: {
            Tab: 2,
            Import: async function(data, tabdata) {
                Utils.ImportSet(data.Tail, tabdata.Tail);
            },
            Export: async function(tabdata) {
                let exported = {};

                if (tabdata.Tail.Type > 0) {
                    exported.Tail = Utils.ExportSet(tabdata.Tail);
                }

                return exported;
            },
            SetupFunctions: async function(container) {
                let setup = {};

                setup.Tail = Utils.DefineSet(container, "Tail");

                return setup;
            }
        },
        ["Face"]: {
            Tab: 3,
            Container: null,
            Import: async function(data, tabdata) {
                tabdata.EyeColor.Value = data.EyeColor || "000000";
                tabdata.EyeColorLeft.Value = data.EyeColorLeft || null;
                tabdata.EyeWhitesColor.Value = data.EyeWhitesColor || "ffffff";

                let right = data.Eyes || 0;
                let left = typeof(data.LeftEye) == "number" ? data.LeftEye : null;
                this.SetEyes([right, left]);

                tabdata.Eyeshadow.Value = data.Eyeshadow || null;
                tabdata.Eyelashes.Value = data.Eyelashes || 0;

                tabdata.Expression.Value = data.Expression || 0;
                tabdata.Fangs.Value = data.Fangs || 0;

                if (data.Markings) {
                    tabdata.Markings.Value = data.Markings || 0;
                    tabdata.MarkingsColor.Value = data.MarkingsColor || "FFFFFF";
                } else {
                    tabdata.Markings.Value = 0;
                }

                Utils.ImportSet(data.FacialHair, tabdata.FacialHair);
                Utils.ImportSet(data.Muzzle, tabdata.Muzzle);
            },
            Export: async function(tabdata) {
                let exported = {};

                if (tabdata.EyeColor.Value !== "000000") {
                    exported.EyeColor = tabdata.EyeColor.Value;
                }

                if (tabdata.EyeColorLeft.Enabled) {
                    exported.EyeColorLeft = tabdata.EyeColorLeft.Value;
                }

                if (tabdata.EyeWhitesColor.Value !== "ffffff") {
                    exported.EyeWhitesColor = tabdata.EyeWhitesColor.Value;
                }

                let [right, left] = this.GetEyes();

                if (right !== 0) {
                    exported.Eyes = right;
                }

                if (typeof(left) == "number") {
                    exported.LeftEye = left;
                }

                if (tabdata.Eyeshadow.Enabled) {
                    exported.Eyeshadow = tabdata.Eyeshadow.Value;
                }

                if (tabdata.Eyelashes.Value > 0) {
                    exported.Eyelashes = tabdata.Eyelashes.Value;
                }

                exported.Muzzle = Utils.ExportSet(tabdata.Muzzle);

                if (tabdata.Expression.Value > 0) {
                    exported.Expression = tabdata.Expression.Value;
                }

                if (tabdata.Fangs.Value > 0) {
                    exported.Fangs = tabdata.Fangs.Value;
                }

                if (tabdata.Markings.Value > 0) {
                    exported.Markings = tabdata.Markings.Value;
                    exported.MarkingsColor = tabdata.MarkingsColor.Value;
                }

                if (tabdata.FacialHair.Type > 0) {
                    exported.FacialHair = Utils.ExportSet(tabdata.FacialHair);
                }

                return exported;
            },
            GetEyeSelectors: function() {
                let right = Utils.LookupFormGroupByName(this.Container, "Eyes");
                if (right) {
                    return [Utils.FormGroup_DefineSpriteSelection(right), null];
                } else {
                    right = Utils.LookupFormGroupByName(this.Container, "Right eye");
                    let left = Utils.LookupFormGroupByName(this.Container, "Left eye");

                    right = right ? Utils.FormGroup_DefineSpriteSelection(right) : null;
                    left = left ? Utils.FormGroup_DefineSpriteSelection(left) : null;

                    return [right, left];
                }
            },
            SetEyes: async function(values) {
                let right = values[0] || 0;
                let left = values[1] || null;

                let [right_s, left_s] = this.GetEyeSelectors();
                if (left !== null) {
                    right_s.Checked = false;
                    [right_s, left_s] = this.GetEyeSelectors();

                    left_s.Type = left;
                } else {
                    right_s.Checked = true;
                }

                right_s.Type = right;
            },
            GetEyes: function() {
                let [right_s, left_s] = this.GetEyeSelectors();
                let right = right_s ? right_s.Value : 0;
                let left = left_s ? left_s.Value : null;
                return [right, left];
            },
            SetupFunctions: async function(container) {
                let setup = {};
                this.Container = container;

                setup.EyeColor = Utils.FormGroup_DefineColorPicker(Utils.LookupFormGroupByName(container, "Eye color"));
                setup.EyeColorLeft = Utils.FormGroup_DefineColorPicker(Utils.LookupFormGroupByName(container, "Eye color (left)"));
                setup.EyeWhitesColor = Utils.FormGroup_DefineColorPicker(Utils.LookupFormGroupByName(container, "Eye whites color"));

                setup.SetEyes = (values) => { return this.SetEyes(values); }
                setup.GetEyes = () => { return this.GetEyes; }

                setup.Eyeshadow = Utils.FormGroup_DefineColorPicker(Utils.LookupFormGroupByName(container, "Eyeshadow"));
                setup.Eyelashes = Utils.FormGroup_DefineSpriteSelection(Utils.LookupFormGroupByName(container, "Eyelashes"));

                setup.Expression = Utils.FormGroup_DefineSpriteSelection(Utils.LookupFormGroupByName(container, "Expression"));
                setup.Fangs = Utils.FormGroup_DefineSpriteSelection(Utils.LookupFormGroupByName(container, "Fangs"));

                setup.Markings = Utils.FormGroup_DefineSpriteSelection(Utils.LookupFormGroupByName(container, "Markings"));
                setup.MarkingsColor = Utils.FormGroup_DefineColorPicker(Utils.LookupFormGroupByName(container, "Markings color"));

                setup.Muzzle = Utils.DefineSet(container, "Muzzle");
                setup.FacialHair = Utils.DefineSet(container, "Facial hair");

                return setup;
            }
        },
        ["Other"]: {
            Tab: 4,
            TabFunctions: {
                ["Head"]: {
                    Tab: 0,
                    Import: async function(data, tabdata) {
                        Utils.ImportSet(data.HeadAccessories, tabdata.HeadAccessories);
                        Utils.ImportSet(data.EarAccessories, tabdata.EarAccessories);
                        Utils.ImportSet(data.FaceAccessories, tabdata.FaceAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.HeadAccessories.Type > 0) {
                            exported.HeadAccessories = Utils.ExportSet(tabdata.HeadAccessories);
                        }
                        if (tabdata.EarAccessories.Type > 0) {
                            exported.EarAccessories = Utils.ExportSet(tabdata.EarAccessories);
                        }
                        if (tabdata.FaceAccessories.Type > 0) {
                            exported.FaceAccessories = Utils.ExportSet(tabdata.FaceAccessories);
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.HeadAccessories = Utils.DefineSet(container, "Head accessories");
                        setup.EarAccessories = Utils.DefineSet(container, "Ear accessories");
                        setup.FaceAccessories = Utils.DefineSet(container, "Face accessories");

                        return setup;
                    }
                },
                ["Neck"]: {
                    Tab: 1,
                    Import: async function(data, tabdata) {
                        Utils.ImportSet(data.NeckAccessories, tabdata.NeckAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.NeckAccessories.Type > 0) {
                            exported.NeckAccessories = Utils.ExportSet(tabdata.NeckAccessories);
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.NeckAccessories = Utils.DefineSet(container, "Neck accessories");

                        return setup;
                    }
                },
                ["Legs"]: {
                    Tab: 2,
                    Import: async function(data, tabdata) {
                        let same_legs = (data.SameBackLegs == false) ? false : true;

                        await tabdata.SetSameBackLegs(same_legs);
                        Utils.ImportSet(data.FrontLegAccessories, tabdata.FrontLegAccessories);

                        if (!same_legs) {
                            Utils.ImportSet(data.BackLegAccessories, tabdata.BackLegAccessories);
                        }
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.FrontLegAccessories.Type > 0) {
                            exported.FrontLegAccessories = Utils.ExportSet(tabdata.FrontLegAccessories);
                        }

                        if (!tabdata.GetSameBackLegs()) {
                            exported.SameBackLegs = false;
                        }

                        if (!tabdata.GetSameBackLegs()) {
                            if (tabdata.BackLegAccessories.Type > 0) {
                                exported.BackLegAccessories = Utils.ExportSet(tabdata.BackLegAccessories);
                            }
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.FrontLegAccessories = Utils.DefineSet(container, "Front leg accessories");

                        let same_back_legs = container.querySelector("div").querySelector("div:scope > div > div > check-box");
                        Utils.DefineCheckbox(setup, "SameBackLegs", same_back_legs);

                        setup.SetSameBackLegs = (value) => {
                            Utils.SetCheckbox(same_back_legs, value);

                            return new Promise(function(resolve) {
                                resolve();
                            }).then(() => {
                                if (!value) {
                                    setup.BackLegAccessories = Utils.DefineSet(container, "Back leg accessories");
                                } else {
                                    setup.BackLegAccessories = null;
                                }
                            });
                        };

                        setup.GetSameBackLegs = () => {
                            return Utils.IsCheckboxChecked(same_back_legs);
                        };

                        if (!Utils.IsCheckboxChecked(same_back_legs)) {
                            setup.BackLegAccessories = Utils.DefineSet(container, "Back leg accessories");
                        }

                        return setup;
                    }
                },
                ["Chest"]: {
                    Container: null,
                    Tab: 3,
                    Import: async function(data, tabdata) {
                        Utils.ImportSet(data.ChestAccessories, tabdata.ChestAccessories);

                        // I know.
                        if (tabdata.ChestAccessories.Type > 1) {
                            let sleeves = Utils.DefineSet(this.Container, "Sleeves");
                            Utils.ImportSet(data.Sleeves, sleeves);
                        }
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.ChestAccessories.Type > 0) {
                            exported.ChestAccessories = Utils.ExportSet(tabdata.ChestAccessories);
                            if (tabdata.ChestAccessories.Type > 1) {
                                exported.Sleeves = Utils.ExportSet(tabdata.Sleeves);
                            }
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        this.Container = container;

                        let setup = {};

                        setup.ChestAccessories = Utils.DefineSet(container, "Chest accessories");
                        setup.Sleeves = Utils.DefineSet(container, "Sleeves");

                        return setup;
                    }
                },
                ["Back"]: {
                    Tab: 4,
                    Import: async function(data, tabdata) {
                        Utils.ImportSet(data.BackAccessories, tabdata.BackAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.BackAccessories.Type > 0) {
                            exported.BackAccessories = Utils.ExportSet(tabdata.BackAccessories);
                        }
                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.BackAccessories = Utils.DefineSet(container, "Back accessories");

                        return setup;
                    }
                },
                ["Waist"]: {
                    Tab: 5,
                    Import: async function(data, tabdata) {
                        Utils.ImportSet(data.WaistAccessories, tabdata.WaistAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.WaistAccessories.Type > 0) {
                            exported.WaistAccessories = Utils.ExportSet(tabdata.WaistAccessories);
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.WaistAccessories = Utils.DefineSet(container, "Waist accessories");

                        return setup;
                    }
                },
                ["Other"]: {
                    Tab: 6,
                    Import: async function(data, tabdata) {
                        Utils.ImportSet(data.ExtraAccessories, tabdata.ExtraAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        exported.ExtraAccessories = Utils.ExportSet(tabdata.ExtraAccessories);

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.ExtraAccessories = Utils.DefineSet(container, "Extra accessories");

                        return setup;
                    }
                }
            },
            Import: async function(data, tabdata) {
                let exported = {};

                for (let i in this.TabFunctions) {
                    let v = this.TabFunctions[i];
                    debug("> Importing tab #" + i + " (" + i + ")...");

                    let localdata = data[i] || {};
                    await v.Import(localdata, await PonyTown.SetAccessoryTab(v.Tab));
                }

                return exported;
            },
            Export: async function(tabdata) {
                let data = {};
                for (var i in this.TabFunctions) {
                    let v = this.TabFunctions[i];
                    debug("> Exporting tab #" + i + " (" + i + ")...");
                    let exported = await v.Export(await PonyTown.SetAccessoryTab(v.Tab));

                    Object.keys(exported).forEach((key) => (exported[key] == null || exported[key] == undefined) && delete exported[key]);

                    if (Object.keys(exported).length > 0) {
                        data[i] = exported;
                    }
                }
                return data;
            },
            SetupFunctions: async function(container) {
                let current_tab = PonyTown.GetAccessoryTab();

                for (let i in this.TabFunctions) {
                    let v = this.TabFunctions[i];

                    if (v.Tab === current_tab) {
                        let _container = container.querySelector("tab.active.tab-pane");
                        return await v.SetupFunctions(_container);
                    }
                }
            }
        }
    };

    var Character = {
        Export: async function() {
            let data = {};

            for (var i in TabFunctions) {
                let v = TabFunctions[i];
                debug("Exporting tab #" + i + " (" + i + ")...");

                let exported = await v.Export(await PonyTown.SetTab(v.Tab));
                Object.keys(exported).forEach((key) => (exported[key] == null || exported[key] == undefined) && delete exported[key]);

                if (Object.keys(exported).length > 0) {
                    data[i] = exported;
                }
            }
            await PonyTown.SetTab(0);

            return data;
        },
        Import: async function(data) {
            data = JSON.parse(data);
            data.Body = data.Body || {};

            (await PonyTown.SetTab(0)).CustomOutlines = data.Body.OutlinesEnabled || false;
            await skipFrame();

            for (var i in TabFunctions) {
                let v = TabFunctions[i];
                debug("Importing tab #" + i + " (" + i + ")...");

                let localdata = data[i] || {};
                await v.Import(localdata, await PonyTown.SetTab(v.Tab));
            }
            await PonyTown.SetTab(0);
        }
    };

    // https://stackoverflow.com/questions/2897619
    var download = function(filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
    }

    var UI = {
        InjectedCSSTag: null,
        ImportDialog: null,
        ExportDialog: null,
        Overlay: null,
        Style: `
        .nmw-ie-fullscreen{position:fixed;width:100%;height:100%;left:0;top:0;background:rgba(51,51,51,0.7);z-index:1;align-items:center;display:flex}
        .nmw-ie-fullscreen .form{display:inline-block;vertical-align:middle;width:550px;left:50%;top:50%;position:static;margin:0 auto;background:#212121;border-radius:25px;border:4px solid #CA7E4E;font-family:Helvetica Neue,Helvetica,Arial,sans-serif;padding-left:.5rem;padding-right:.5rem}
        .nmw-ie-fullscreen .header{margin-top:.25rem;display:block;text-align:center;line-height:150%;font-size:1.25em;color:#888!important;font-weight:700}
        .nmw-ie-fullscreen .textarea{display:block;line-height:150%;margin-left:auto;margin-right:auto;width:100%;height:200px}
        .nmw-ie-fullscreen .form .text{display:block;text-align:center;font-size:1.25em;color:#CCC!important;font-weight:700}
        .nmw-ie-fullscreen .warning{display:block;text-align:center;font-size:1em;line-height:150%;color:#CA7E4E!important;font-weight:700}
        .nmw-ie-fullscreen hr{border:0;border-top:1px solid #555;margin-top:.5rem;margin-bottom:.5rem}
        .nmw-ie-fullscreen .form button{display:block;margin-left:auto;margin-right:auto;height:5%;width:100%;font-size:1em;color:#FFF!important;font-weight:800}
        .nmw-ie-fullscreen .form .footer{height:16px;width:100%}
        .nmw-ie-fullscreen .form .footer .elements{height:16px;float:right;line-height:16px;margin-top:.5rem;margin-bottom:.5rem}
        .nmw-ie-fullscreen .form .line-center{margin-top:.5rem;margin-bottom:.5rem;display:flex;justify-content:center;align-items:center}
        .nmw-ie-fullscreen .input{width:.1px;height:.1px;opacity:0;overflow:hidden;position:absolute;z-index:-1}
        .nmw-ie-fullscreen .form .footer .elements .text{display:inline;font-size:.75em;color:#CA7E4E!important}
        .nmw-ie-fullscreen .link{display:inline;fill:#1da1f2;text-decoration:none}
        .nmw-ie-fullscreen .file-upload-box .input + label{border:2px solid #CA7E4E;padding:.05rem 1.25rem;font-size:1.25em;font-weight:700;color:#fff;background-color:#000;display:inline-block;cursor:pointer}
        .nmw-ie-fullscreen .file-upload-box .input:focus + label,.file-upload-box .input + label:hover{background-color:#B57046}
		`,
        ImportHTMLCode: `
		<label class="header">Import character</label>
        <hr/>
        <textarea class="textarea" cols="40" rows="5"></textarea>
        <hr/>
        <label class="text">Paste your character code inside and press Import.</label>
        <div class="line-center">
            <div class="file-upload-box">
                <input id="file" class="input" accept=".json,.txt" type="file">
                <label for="file">Or select a file</label>
            </div>
        </div>
        <label class="warning">
        Careful! This will erase current character settings.
        </label>
        <hr/>
        <button class="btn btn-primary">Import</button>
        <hr/>`,
        ExportHTMLCode: `
        <label class="header">Exported character</label>
        <hr/>
        <textarea readonly class="textarea" cols="40" rows="5"></textarea>
        <hr/>
        <div class="line-center">
            <label class="text">Press Ctrl+C to copy, or </label>
            <a id="dl" class="link" style="margin-left: 0.5rem;">
                <svg viewBox="0 0 30 30" width="32" height="32"><path d="M22,4h-2v6c0,0.552-0.448,1-1,1h-9c-0.552,0-1-0.448-1-1V4H6C4.895,4,4,4.895,4,6v18c0,1.105,0.895,2,2,2h18  c1.105,0,2-0.895,2-2V8L22,4z M22,24H8v-6c0-1.105,0.895-2,2-2h10c1.105,0,2,0.895,2,2V24z"/><rect height="5" width="2" x="16" y="4"/></svg>
            </a>
        </div>
        <hr/>
        <button class="btn btn-primary">Dismiss</button>
        <hr/>
		`,
        FooterHTMLCode: `
		<div class="footer">
			<div class="elements">
				<label class="text">PonyTown © Agamnentzar, Import/Export © NotMyWing</label>
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
            if (!this.InjectedCSSTag) {
                let head = document.querySelector("head");
                let css = this.InjectedCSSTag = document.createElement("style");
                css.type = "text/css";
                css.innerHTML = this.Style;

                head.appendChild(css);
            }

            if (!this.Overlay) {
                let body = document.querySelector("body");
                let e = this.Overlay = document.createElement("div");
                e.style.display = 'none';
                e.classList.add("nmw-ie-fullscreen");

                body.appendChild(e);
            }

            if (!this.ImportDialog) {
                let e = this.ImportDialog = document.createElement("div");
                e.style.display = 'none';
                e.classList.add("form");
                e.innerHTML = this.ImportHTMLCode + this.FooterHTMLCode;

                let textarea = this.ImportDialog.querySelector("textarea");
                textarea.onkeypress = function(ev) {
                    if (ev.keyCode == 10 || (ev.ctrlKey && ev.keyCode == 13)) {
                        UI.StartImporting(textarea.value);
                    }
                };

                let button = e.querySelector("button");
                button.onclick = function() { UI.StartImporting(textarea.value); };

                var change = function() {
                    setTimeout(() => {
                        if (textarea.value != "") {
                            button.innerHTML = "Import!";
                        } else {
                            button.innerHTML = "Dismiss";
                        }
                    }, 0);
                };
                textarea.onkeyup = change;
                textarea.onchange = change;
                textarea.onpaste = change;

                let fileinput = e.querySelector("input");
                fileinput.onchange = function() {
                    let file = fileinput.files[0];
                    if (file) {
                        var reader = new FileReader();
                        reader.readAsText(file, "UTF-8");
                        reader.onload = function(evt) {
                            UI.StartImporting(evt.target.result);
                        }
                        UI.HideForms();
                        UI.HideOverlay();
                    }
                }

                this.Overlay.appendChild(e);
            }

            if (!this.ExportDialog) {
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

                let dl = e.querySelector("[id='dl']");
                dl.onclick = function() {
                    let name = document.querySelector("character-select > div > input");
                    name = (name ? name.value : "character") + ".json";

                    download(name, textarea.value);
                }

                this.Overlay.appendChild(e);
            }
        },
        ShowImport: function() {
            this.InjectHTML();
            if (!this.Overlay || !this.ImportDialog) {
                return;
            }

            this.ShowOverlay();
            this.ImportDialog.style.display = "table-cell";

            let fileinput = this.ImportDialog.querySelector("input");
            fileinput.value = "";

            let button = this.ImportDialog.querySelector("button");
            button.innerHTML = "Dismiss";

            let textarea = this.ImportDialog.querySelector("textarea");
            textarea.value = "";
            textarea.focus();
        },
        ShowOverlay: async function() {
            document.querySelector("body").style.overflow = "hidden";
            this.Overlay.style.display = "flex";
        },
        ShowExport: async function() {
            this.InjectHTML();
            if (!this.Overlay || !this.ExportDialog) {
                return;
            }

            let data = null;
            try {
                data = JSON.stringify(await Character.Export());
            } catch (err) {
                throw err;
            }

            let textarea = this.ExportDialog.querySelector("textarea");
            this.ShowOverlay();
            this.ExportDialog.style.display = "table-cell";
            textarea.value = data;
            textarea.focus();
            textarea.setSelectionRange(0, textarea.value.length);
        },
        StartImporting: async function(data) {
            try {
                await Character.Import(data);
            } catch (err) {
                throw err;
            } finally {
                this.HideForms();
                this.HideOverlay();
            }
        },
        HideForms: function() {
            this.ImportDialog.style.display = "none";
            this.ExportDialog.style.display = "none";
        },
        HideOverlay: function() {
            this.Overlay.style.display = "none";
            document.querySelector("body").style.overflow = "";
        },
    }

    // --
    //
    // Injection.
    //
    // --

    var InjectBodyTab = function() {
        if (PonyTown.GetTab() === 0) {
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
            ButtonGroup.className = "btn-group";

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
            if (!version || (version.children[0] && version.children[0].innerHTML != targetPonyTownVersion)) {
                let div = document.createElement("div");
                div.innerHTML = "Hold on! I/E wasn't tested to work with current version";

                let anchor = document.createElement("a");
                anchor.setAttribute("target", "_blank");
                anchor.setAttribute("href", githubScriptLink);
                anchor.innerHTML = "Click here to check for updates.";

                div.appendChild(document.createElement("br"));
                div.appendChild(anchor);
                FormBody.appendChild(div);
            }

            bodyTab.prepend(document.createElement("br"));
        }
    };

    // Set observer.
    var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            let element = mutations[i].target;
            if (mutations[i].removedNodes.length === 0 && element.tagName == "TAB") {
                if (element.getAttribute("heading") && element.className.search("active") != 1) {
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

    if (debugging) {
        window.Character = Character;
        window.Utils = Utils;
        window.PonyTown = PonyTown;
    }
})();