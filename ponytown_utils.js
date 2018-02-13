(function() {
    'use strict';

    var clickEvent = new Event('click');
    var inputEvent = new Event('input');
    var mousedownEvent = new Event('mousedown');
    var mouseupEvent = new Event('mouseup');

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
        },
        CharacterEditor: {
            GetTab: function() {
                // Thanks, Keu!
                return Number(localStorage["character-active-tab"]);
            },
            SetTab: async function(tab) {
                if (this.GetTab() != tab) {
                    let tabset = document.querySelector(".character-tabs > tabset");
                    let hrefs = tabset.querySelectorAll('tabset > ul > li.nav-item > a');

                    if (hrefs[tab].className.search("active") == -1) {
                        hrefs[tab].dispatchEvent(clickEvent);
                    }
                }
            },
            GetAccessoryTab: function() {
                return Number(localStorage["character-active-accessory-tab"]);
            },
            SetAccessoryTab: async function(tab) {
                if (this.GetTab() != 4)
                    return;
                if (this.GetAccessoryTab() != tab) {
                    let tabset = document.querySelector(".tab-pane.active > .accessory-tab")
                        .parentNode // accessory-tab
                        .parentNode // tab-content
                        .parentNode; // tabset
                    let hrefs = tabset.querySelectorAll('tabset > ul > li.nav-item > a');

                    if (hrefs[tab].className.search("active") == -1) {
                        hrefs[tab].dispatchEvent(clickEvent);
                    }
                }
            },
            OpenCharacterSelection: async function(cb) {
                let character_selection = document.querySelector("character-select");
                let dropdown_button = character_selection.querySelector("button.dropdown-toggle")

                let expanded = dropdown_button.getAttribute("aria-expanded")

                let clicked = false;
                if (!expanded || expanded == "false") {
                    await dropdown_button.click();
                    clicked = true;
                }

                let list = document.querySelector(".character-list.dropdown-menu > .character-select-list");
                if (list) {
                    try {
                        return cb(list);
                    } finally {
                        let list = document.querySelector(".character-list.dropdown-menu > .character-select-list");
                        if (list && clicked)
                            dropdown_button.click();
                    }
                }
            },
            GetCharacterList: async function() {
                let result = await this.OpenCharacterSelection((list) => {
                    let characters = [];
                    for (let i = 0; i < list.children.length; i++) {
                        let name = list.children[i].querySelector("a");
                        name = name ? (name.innerHTML ? name.innerHTML : null) : null;
                        characters.push(name);
                    }
                    return characters;
                });
                return result;
            },
            SelectCharacter: async function(i) {
                await this.OpenCharacterSelection((list) => {
                    let anchors = list.querySelectorAll("a");
                    if (anchors[i] && anchors[i].click) {
                        anchors[i].click();
                    }
                });
            },
            GetCharacterName: function() {
                let input = document.querySelector("character-select > div > input");

                return input ? input.value : null;
            },
            SetCharacterName: function(value) {
                let input = document.querySelector("character-select > div > input");

                if (input) {
                    input.value = value;
                    input.dispatchEvent(inputEvent);
                }
            }
        }
    };
    window.PonyTownUtils = Utils;

    return Utils;
})();