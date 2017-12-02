// ==UserScript==
// @name        PonyTown Import/Export
// @namespace   azedith
// @include     https://pony.town/*
// @author      @NotMyWing
// @version     0.29.0pre1
// @grant       GM_addStyle
// @require     https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @require     https://raw.githubusercontent.com/Neeve01/PonyTown-Import-Export/experimental/ponytown_utils.js
// @downloadURL https://github.com/Neeve01/PonyTown-Import-Export/raw/experimental/PonyTown_IE.user.js
// ==/UserScript==

(function() {
    'use strict';

    var Resources = {
        ['css']: `
        .nmw-overlay{background-color:rgba(51,51,51,0.7);position:fixed;width:100%;height:100%;left:0;top:0;z-index:1;align-items:center}
        .nmw-overlay:not(:empty){display:flex}
        .nmw-overlay:empty{display:none}
        .nmw-overlay .nmw-form{display:inline-block;vertical-align:middle;width:550px;left:50%;top:50%;margin:0 auto;background:#212121;font-family:Helvetica Neue,Helvetica,Arial,sans-serif}
        .nmw-overlay .nmw-form .nmw-contents{border:1px solid #9d603b;border-top:none;padding:.75% 1% .25%}
        .nmw-overlay .nmw-textarea{display:block;margin-left:auto;margin-right:auto;width:100%;height:250px}
        .nmw-overlay .nmw-form .nmw-text{display:block;text-align:center;font-size:1.25em;color:#CCC!important;font-weight:700}
        .nmw-overlay .nmw-warning{display:block;text-align:center;font-size:1em;line-height:150%;color:#CA7E4E!important;font-weight:700}
        .nmw-overlay hr{border:0;border-top:1px solid #555;margin-top:.5rem;margin-bottom:.5rem}
        .nmw-overlay .nmw-form .nmw-line-center{display:flex;justify-content:center}
        .nmw-overlay .nmw-input{width:.1px;height:.1px;opacity:0;overflow:hidden;position:absolute;z-index:-1}
        .nmw-overlay .nmw-link{display:inline;margin-left:.5%}
        .nmw-overlay .nmw-form .nmw-btn-close{border:0 solid;background:#CA7E4E;width:5%;padding-bottom:5%;margin:0;color:#FFF;font-size:.75em;border-radius:0}
        .nmw-overlay .nmw-form .nmw-btn-wide{width:100%}
        .nmw-overlay .nmw-inpad{padding-left:1%;padding-right:1%}
        .nmw-overlay .nmw-header{margin:0;padding:0;background:#9d603b;text-align:center;line-height:150%;font-size:1.1em;color:#fff;font-weight:400;padding-left:1%;margin:0}
        .nmw-overlay .nmw-row{display:flex;justify-content:space-between}
        .nmw-overlay .nmw-row .nmw-col{padding:0;margin:0}
        .nmw-overlay .nmw-form .nmw-footer{height:12px}
        .nmw-overlay .nmw-form .nmw-footer .nmw-elements{display:flex;height:inherit;justify-content:flex-end;line-height:1}
        .nmw-overlay .nmw-form .nmw-footer .nmw-elements .nmw-text{height:inherit;color:#CA7E4E!important;font-size:.75em}
        `,
        ['import-frame']: `
        <div class="nmw-row nmw-header">
            <label class="nmw-col">Import character</label>
            <button id="nmw-button-close" class="nmw-btn-close btn btn-primary nmw-col">
                <i class="fa fa-lg fa-times"></i>
            </button>
        </div>
        <div class="nmw-contents">
            <textarea autofocus class="nmw-textarea" cols="40" rows="5"></textarea>
            <hr>
            <div>
                <label class="nmw-text">Paste your character code inside and press Import.</label>
                <label class="nmw-warning">Careful! This will erase current character settings.</label>
            </div>
            <hr>
            <input id="file" class="nmw-input" accept=".json,.txt" type="file">
            <div class="nmw-row btn-group">
                <label id="nwm-button-import" class="btn btn-primary nmw-btn-wide">Import</label>
                <label class="btn btn-primary" for="file">Import from file</label>
            </div>
            <div class="nmw-footer">
                <div class="nmw-elements">
                    <label class="nmw-text">Import/Export © NotMyWing</label>
                    <a target="_blank" href="https://twitter.com/NotMyWing" class="nmw-link">
                        <i class="fa fa-twitter"></i>
                    </a>
                    <a target="_blank" href="https://github.com/Neeve01" class="nmw-link">
                        <i class="fa fa-github"></i>
                    </a>
                </div>
            </div>
        </div>
        `,
        ['export-frame']: `
        <div class="nmw-row nmw-header">
            <label class="nmw-col">Exported character</label>
            <button id="nmw-button-close" class="nmw-btn-close btn btn-primary nmw-col">
                <i class="fa fa-lg fa-times"></i>
            </button>
        </div>
        <div class="nmw-contents">
            <textarea autofocus readonly class="nmw-textarea" cols="40" rows="5"></textarea>
            <hr>
            <div class="nmw-line-center">
                <label class="nmw-text">Press Ctrl+C to copy, or</label>
                <a id="nmw-button-download" style="margin-left: 1.25%;">
                    <i class="fa fa-2x fa-floppy-o"></i>
                </a>
            </div>
            <div class="nmw-footer">
                <div class="nmw-elements">
                    <label class="nmw-text">Import/Export © NotMyWing</label>
                    <a target="_blank" href="https://twitter.com/NotMyWing" class="nmw-link">
                        <i class="fa fa-twitter"></i>
                    </a>
                    <a target="_blank" href="https://github.com/Neeve01" class="nmw-link">
                        <i class="fa fa-github"></i>
                    </a>
                </div>
            </div>
        </div>
        `
    }

    var debugging = true;

    var targetPonyTownVersion = "0.29.0-alpha";
    var githubLink = "https://github.com/Neeve01";
    var twitterLink = "https://twitter.com/NotMyWing";
    var githubScriptLink = "https://github.com/Neeve01/PonyTown-Import-Export";

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

    var skipFrame = async function() {
        return new Promise(function(resolve) {
            resolve();
        });
    }

    var observer_target = document.querySelector("pony-town-app");

    if (!observer_target) {
        return;
    }

    var TabFunctions = {
        ["Body"]: {
            Tab: 0,
            Import: async function(data, tabdata) {
                tabdata.BodyColors = [data.Color, data.Outline];

                // Horn.
                PonyTownUtils.ImportSet(data.Horn, tabdata.Horn);

                // Wings.
                PonyTownUtils.ImportSet(data.Wings, tabdata.Wings);

                // Ears.
                PonyTownUtils.ImportSet(data.Ears, tabdata.Ears)

                // Front hooves.
                PonyTownUtils.ImportSet(data.FrontHooves, tabdata.FrontHooves);

                // Back hooves.
                PonyTownUtils.ImportSet(data.BackHooves, tabdata.BackHooves);

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
                    exported.Horn = PonyTownUtils.ExportSet(tabdata.Horn);
                }

                // Wings
                if (tabdata.Wings.Type > 0) {
                    exported.Wings = PonyTownUtils.ExportSet(tabdata.Wings);
                }

                // Ears
                if (tabdata.Ears.Type > 0) {
                    exported.Ears = PonyTownUtils.ExportSet(tabdata.Ears);
                }

                // Front hooves
                if (tabdata.FrontHooves.Type > 0) {
                    exported.FrontHooves = PonyTownUtils.ExportSet(tabdata.FrontHooves);
                }

                // Back hooves
                if (tabdata.BackHooves.Type > 0) {
                    exported.BackHooves = PonyTownUtils.ExportSet(tabdata.BackHooves);
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

                    PonyTownUtils.EraseButtmark();

                    if (!pixels) { return; }
                    if (pixels.every((e) => e === "")) { return; }

                    PonyTownUtils.PickBrush();

                    let rows = element.children;
                    let count = 0;
                    for (var i = 0; i < rows.length; i++) {
                        let bits = rows[i].children;
                        for (var j = 0; j < rows.length; j++) {
                            if (pixels[count] !== "") {
                                PonyTownUtils.SetPixel(bits[j], pixels[count]);
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

                PonyTownUtils.DefineCheckbox(setup, "CustomOutlines", checkbox);
                PonyTownUtils.DefineFillOutline(setup, "BodyColors", container.querySelector('[label="Body color"]'));

                setup.Horn = PonyTownUtils.DefineSet(container, "Horn");
                setup.Wings = PonyTownUtils.DefineSet(container, "Wings");
                setup.Ears = PonyTownUtils.DefineSet(container, "Ears");
                setup.FrontHooves = PonyTownUtils.DefineSet(container, "Front hooves");
                setup.BackHooves = PonyTownUtils.DefineSet(container, "Back hooves");

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

                PonyTownUtils.DefineCheckbox(setup, "FlipButtmark", flip_checkbox);

                return setup;
            }
        },
        ["Mane"]: {
            Tab: 1,
            Import: async function(data, tabdata) {
                PonyTownUtils.ImportSet(data.Mane, tabdata.Mane);
                PonyTownUtils.ImportSet(data.Backmane, tabdata.Backmane);
            },
            Export: async function(tabdata) {
                let exported = {};

                if (tabdata.Mane.Type > 0) {
                    exported.Mane = PonyTownUtils.ExportSet(tabdata.Mane);
                }

                if (tabdata.Backmane.Type > 0) {
                    exported.Backmane = PonyTownUtils.ExportSet(tabdata.Backmane);
                }

                return exported;
            },
            SetupFunctions: async function(container) {
                let setup = {};

                setup.Mane = PonyTownUtils.DefineSet(container, "Mane");
                setup.Backmane = PonyTownUtils.DefineSet(container, "Back mane");

                return setup;
            }
        },
        ["Tail"]: {
            Tab: 2,
            Import: async function(data, tabdata) {
                PonyTownUtils.ImportSet(data.Tail, tabdata.Tail);
            },
            Export: async function(tabdata) {
                let exported = {};

                if (tabdata.Tail.Type > 0) {
                    exported.Tail = PonyTownUtils.ExportSet(tabdata.Tail);
                }

                return exported;
            },
            SetupFunctions: async function(container) {
                let setup = {};

                setup.Tail = PonyTownUtils.DefineSet(container, "Tail");

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

                PonyTownUtils.ImportSet(data.FacialHair, tabdata.FacialHair);
                PonyTownUtils.ImportSet(data.Muzzle, tabdata.Muzzle);
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

                exported.Muzzle = PonyTownUtils.ExportSet(tabdata.Muzzle);

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
                    exported.FacialHair = PonyTownUtils.ExportSet(tabdata.FacialHair);
                }

                return exported;
            },
            GetEyeSelectors: function() {
                let right = PonyTownUtils.LookupFormGroupByName(this.Container, "Eyes");
                if (right) {
                    return [PonyTownUtils.FormGroup_DefineSpriteSelection(right), null];
                } else {
                    right = PonyTownUtils.LookupFormGroupByName(this.Container, "Right eye");
                    let left = PonyTownUtils.LookupFormGroupByName(this.Container, "Left eye");

                    right = right ? PonyTownUtils.FormGroup_DefineSpriteSelection(right) : null;
                    left = left ? PonyTownUtils.FormGroup_DefineSpriteSelection(left) : null;

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

                setup.EyeColor = PonyTownUtils.FormGroup_DefineColorPicker(PonyTownUtils.LookupFormGroupByName(container, "Eye color"));
                setup.EyeColorLeft = PonyTownUtils.FormGroup_DefineColorPicker(PonyTownUtils.LookupFormGroupByName(container, "Eye color (left)"));
                setup.EyeWhitesColor = PonyTownUtils.FormGroup_DefineColorPicker(PonyTownUtils.LookupFormGroupByName(container, "Eye whites color"));

                setup.SetEyes = (values) => { return this.SetEyes(values); }
                setup.GetEyes = () => { return this.GetEyes; }

                setup.Eyeshadow = PonyTownUtils.FormGroup_DefineColorPicker(PonyTownUtils.LookupFormGroupByName(container, "Eyeshadow"));
                setup.Eyelashes = PonyTownUtils.FormGroup_DefineSpriteSelection(PonyTownUtils.LookupFormGroupByName(container, "Eyelashes"));

                setup.Expression = PonyTownUtils.FormGroup_DefineSpriteSelection(PonyTownUtils.LookupFormGroupByName(container, "Expression"));
                setup.Fangs = PonyTownUtils.FormGroup_DefineSpriteSelection(PonyTownUtils.LookupFormGroupByName(container, "Fangs"));

                setup.Markings = PonyTownUtils.FormGroup_DefineSpriteSelection(PonyTownUtils.LookupFormGroupByName(container, "Markings"));
                setup.MarkingsColor = PonyTownUtils.FormGroup_DefineColorPicker(PonyTownUtils.LookupFormGroupByName(container, "Markings color"));

                setup.Muzzle = PonyTownUtils.DefineSet(container, "Muzzle");
                setup.FacialHair = PonyTownUtils.DefineSet(container, "Facial hair");

                return setup;
            }
        },
        ["Other"]: {
            Tab: 4,
            TabFunctions: {
                ["Head"]: {
                    Tab: 0,
                    Import: async function(data, tabdata) {
                        PonyTownUtils.ImportSet(data.HeadAccessories, tabdata.HeadAccessories);
                        PonyTownUtils.ImportSet(data.EarAccessories, tabdata.EarAccessories);
                        PonyTownUtils.ImportSet(data.FaceAccessories, tabdata.FaceAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.HeadAccessories.Type > 0) {
                            exported.HeadAccessories = PonyTownUtils.ExportSet(tabdata.HeadAccessories);
                        }
                        if (tabdata.EarAccessories.Type > 0) {
                            exported.EarAccessories = PonyTownUtils.ExportSet(tabdata.EarAccessories);
                        }
                        if (tabdata.FaceAccessories.Type > 0) {
                            exported.FaceAccessories = PonyTownUtils.ExportSet(tabdata.FaceAccessories);
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.HeadAccessories = PonyTownUtils.DefineSet(container, "Head accessories");
                        setup.EarAccessories = PonyTownUtils.DefineSet(container, "Ear accessories");
                        setup.FaceAccessories = PonyTownUtils.DefineSet(container, "Face accessories");

                        return setup;
                    }
                },
                ["Neck"]: {
                    Tab: 1,
                    Import: async function(data, tabdata) {
                        PonyTownUtils.ImportSet(data.NeckAccessories, tabdata.NeckAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.NeckAccessories.Type > 0) {
                            exported.NeckAccessories = PonyTownUtils.ExportSet(tabdata.NeckAccessories);
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.NeckAccessories = PonyTownUtils.DefineSet(container, "Neck accessories");

                        return setup;
                    }
                },
                ["Legs"]: {
                    Tab: 2,
                    Import: async function(data, tabdata) {
                        let same_legs = (data.SameBackLegs == false) ? false : true;

                        await tabdata.SetSameBackLegs(same_legs);
                        PonyTownUtils.ImportSet(data.FrontLegAccessories, tabdata.FrontLegAccessories);

                        if (!same_legs) {
                            PonyTownUtils.ImportSet(data.BackLegAccessories, tabdata.BackLegAccessories);
                        }
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.FrontLegAccessories.Type > 0) {
                            exported.FrontLegAccessories = PonyTownUtils.ExportSet(tabdata.FrontLegAccessories);
                        }

                        if (!tabdata.GetSameBackLegs()) {
                            exported.SameBackLegs = false;
                        }

                        if (!tabdata.GetSameBackLegs()) {
                            if (tabdata.BackLegAccessories.Type > 0) {
                                exported.BackLegAccessories = PonyTownUtils.ExportSet(tabdata.BackLegAccessories);
                            }
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.FrontLegAccessories = PonyTownUtils.DefineSet(container, "Front leg accessories");

                        let same_back_legs = container.querySelector("div").querySelector("div:scope > div > div > check-box");
                        PonyTownUtils.DefineCheckbox(setup, "SameBackLegs", same_back_legs);

                        setup.SetSameBackLegs = (value) => {
                            PonyTownUtils.SetCheckbox(same_back_legs, value);

                            return new Promise(function(resolve) {
                                resolve();
                            }).then(() => {
                                if (!value) {
                                    setup.BackLegAccessories = PonyTownUtils.DefineSet(container, "Back leg accessories");
                                } else {
                                    setup.BackLegAccessories = null;
                                }
                            });
                        };

                        setup.GetSameBackLegs = () => {
                            return PonyTownUtils.IsCheckboxChecked(same_back_legs);
                        };

                        if (!PonyTownUtils.IsCheckboxChecked(same_back_legs)) {
                            setup.BackLegAccessories = PonyTownUtils.DefineSet(container, "Back leg accessories");
                        }

                        return setup;
                    }
                },
                ["Chest"]: {
                    Container: null,
                    Tab: 3,
                    Import: async function(data, tabdata) {
                        PonyTownUtils.ImportSet(data.ChestAccessories, tabdata.ChestAccessories);

                        // I know.
                        if (tabdata.ChestAccessories.Type > 1) {
                            let sleeves = PonyTownUtils.DefineSet(this.Container, "Sleeves");
                            PonyTownUtils.ImportSet(data.Sleeves, sleeves);
                        }
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.ChestAccessories.Type > 0) {
                            exported.ChestAccessories = PonyTownUtils.ExportSet(tabdata.ChestAccessories);
                            if (tabdata.ChestAccessories.Type > 1) {
                                exported.Sleeves = PonyTownUtils.ExportSet(tabdata.Sleeves);
                            }
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        this.Container = container;

                        let setup = {};

                        setup.ChestAccessories = PonyTownUtils.DefineSet(container, "Chest accessories");
                        setup.Sleeves = PonyTownUtils.DefineSet(container, "Sleeves");

                        return setup;
                    }
                },
                ["Back"]: {
                    Tab: 4,
                    Import: async function(data, tabdata) {
                        PonyTownUtils.ImportSet(data.BackAccessories, tabdata.BackAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.BackAccessories.Type > 0) {
                            exported.BackAccessories = PonyTownUtils.ExportSet(tabdata.BackAccessories);
                        }
                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.BackAccessories = PonyTownUtils.DefineSet(container, "Back accessories");

                        return setup;
                    }
                },
                ["Waist"]: {
                    Tab: 5,
                    Import: async function(data, tabdata) {
                        PonyTownUtils.ImportSet(data.WaistAccessories, tabdata.WaistAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        if (tabdata.WaistAccessories.Type > 0) {
                            exported.WaistAccessories = PonyTownUtils.ExportSet(tabdata.WaistAccessories);
                        }

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.WaistAccessories = PonyTownUtils.DefineSet(container, "Waist accessories");

                        return setup;
                    }
                },
                ["Other"]: {
                    Tab: 6,
                    Import: async function(data, tabdata) {
                        PonyTownUtils.ImportSet(data.ExtraAccessories, tabdata.ExtraAccessories);
                    },
                    Export: async function(tabdata) {
                        let exported = {};

                        exported.ExtraAccessories = PonyTownUtils.ExportSet(tabdata.ExtraAccessories);

                        return exported;
                    },
                    SetupFunctions: async function(container) {
                        let setup = {};

                        setup.ExtraAccessories = PonyTownUtils.DefineSet(container, "Extra accessories");

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
                    await PonyTownUtils.CharacterEditor.SetAccessoryTab(v.Tab);
                    let _tabdata = await Character.SetupFunctions();

                    await v.Import(localdata, _tabdata);
                }

                return exported;
            },
            Export: async function(tabdata) {
                let data = {};
                for (var i in this.TabFunctions) {
                    let v = this.TabFunctions[i];
                    debug("> Exporting tab #" + i + " (" + i + ")...");

                    await PonyTownUtils.CharacterEditor.SetAccessoryTab(v.Tab);
                    let _tabdata = await Character.SetupFunctions();

                    let exported = await v.Export(_tabdata);

                    Object.keys(exported).forEach((key) => (exported[key] == null || exported[key] == undefined) && delete exported[key]);

                    if (Object.keys(exported).length > 0) {
                        data[i] = exported;
                    }
                }
                return data;
            },
            SetupFunctions: async function(container) {
                let current_tab = PonyTownUtils.CharacterEditor.GetAccessoryTab();
                console.log(current_tab);

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
        SetupFunctions: async function() {
            let tab = PonyTownUtils.CharacterEditor.GetTab();
            for (let i in TabFunctions) {
                let v = TabFunctions[i];
                if (v.Tab === tab) {
                    let container = document.querySelector("tabset > div > tab.active.tab-pane");
                    return this.TabData = await v.SetupFunctions(container);
                }
            }
            this.TabData = null;
        },
        Export: async function() {
            let data = {};

            data.Nickname = PonyTownUtils.CharacterEditor.GetCharacterName();

            for (var i in TabFunctions) {
                let v = TabFunctions[i];
                debug("Exporting tab #" + i + " (" + i + ")...");

                await PonyTownUtils.CharacterEditor.SetTab(v.Tab);
                let exported = await v.Export(await this.SetupFunctions());

                Object.keys(exported).forEach((key) => (exported[key] == null || exported[key] == undefined) && delete exported[key]);

                if (Object.keys(exported).length > 0) {
                    data[i] = exported;
                }
            }
            await PonyTownUtils.CharacterEditor.SetTab(0);

            return data;
        },
        Import: async function(data) {
            data = JSON.parse(data);
            data.Body = data.Body || {};

            await PonyTownUtils.CharacterEditor.SetTab(0);
            (await this.SetupFunctions()).CustomOutlines = data.Body.OutlinesEnabled || false;
            await skipFrame();

            for (var i in TabFunctions) {
                let v = TabFunctions[i];
                debug("Importing tab #" + i + " (" + i + ")...");

                let localdata = data[i] || {};
                await PonyTownUtils.CharacterEditor.SetTab(v.Tab);

                await v.Import(localdata, await this.SetupFunctions());
            }

            if (data.Nickname) {
                PonyTownUtils.CharacterEditor.SetCharacterName(data.Nickname);
            }

            await PonyTownUtils.CharacterEditor.SetTab(0);
        }
    };

    var ProgressForm = (function() {
        function form() {
            this.style.display = 'table-cell';

            this.innerHTML = `

            `;
        };

        form.prototype.Close = function() {

        };
    })();

    var ImportForm = (function() {
        var html = Resources["import-frame"];

        function form(overlay) {
            var form = this;
            this.container = document.createElement("div");
            overlay.append(this.container);

            this.container.innerHTML = html;

            this.container.classList.add("nmw-form");

            let textarea = this.container.querySelector("textarea");
            textarea.onkeypress = function(ev) {
                if (ev.keyCode == 10 || (ev.ctrlKey && ev.keyCode == 13)) {
                    form.Import(textarea.value);
                }
            };

            let button = this.container.querySelector("[id='nmw-button-close']");
            button.onclick = function() {
                form.Close();
            };

            let import_button = this.container.querySelector("[id='nmw-button-import']");
            import_button.onclick = function() {
                if (textarea.value)
                    form.Import(textarea.value);
            };

            let fileinput = this.container.querySelector("input");
            fileinput.onchange = function() {
                let file = fileinput.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.readAsText(file, "UTF-8");
                    reader.onload = function(evt) {
                        if (evt.target.result)
                            form.Import(evt.target.result);
                    }
                }
            }

            setTimeout(() => {
                textarea.select();
                textarea.focus();
            }, 50);
        }

        form.prototype.Import = async function(data) {
            try {
                await Character.Import(data);
            } catch (err) {
                throw err;
            } finally {
                this.Close();
            }
        }

        form.prototype.Close = function() {
            this.container.remove();
        }

        return form;
    })();

    var ExportForm = (function() {
        var html = Resources["export-frame"];

        function form(overlay, data) {
            var form = this;
            this.container = document.createElement("div");
            overlay.append(this.container);

            console.log(html)
            this.container.innerHTML = html;

            this.container.classList.add("nmw-form");
            let textarea = this.container.querySelector("textarea");
            textarea.value = data;

            textarea.onclick = function() {
                textarea.focus();
                textarea.select();
            };
            textarea.onclick();

            let button = this.container.querySelector("[id='nmw-button-close']");
            button.onclick = function() {
                form.Close();
            }

            let dl = this.container.querySelector("[id='nmw-button-download']");
            dl.onclick = function() {
                let name = document.querySelector("character-select > div > input");
                name = (name ? name.value : "character") + ".pt.json";

                var blob = new Blob([textarea.value], { type: "application/json" });
                saveAs(blob, name);
            }
        }

        form.prototype.Close = function() {
            this.container.remove();
        }

        return form;
    })();

    var UI = {
        InjectedCSSTag: null,
        ImportDialog: null,
        ExportDialog: null,
        Overlay: null,
        StyleInjected: false,
        InjectHTML: function() {
            if (!this.StyleInjected) {
                this.StyleInjected = true;

                GM_addStyle(Resources["css"]);
            }

            if (!this.Overlay) {
                let body = document.querySelector("body");
                let e = this.Overlay = document.createElement("div");
                e.classList.add("nmw-overlay");

                body.appendChild(e);
            }
        },
        ShowImport: function() {
            this.InjectHTML();

            let form = new ImportForm(this.Overlay);
        },
        ShowExport: async function() {
            this.InjectHTML();

            try {
                let data = JSON.stringify(await Character.Export());
                let form = new ExportForm(this.Overlay, data);
            } catch (err) {
                throw err;
            }
        },
        ExportAll: async function() {
            var zip = new JSZip();

            try {
                let list = await PonyTownUtils.CharacterEditor.GetCharacterList();
                if (list) {
                    let unknown_count = 0;
                    for (let i = 0; i < list.length; i++) {
                        PonyTownUtils.CharacterEditor.SelectCharacter(i);
                        let data = JSON.stringify(await Character.Export());
                        let name = (list[i] || "unknown-" + (++unknown_count)).replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".pt.json";
                        zip.file(name, data);
                    }
                    zip.generateAsync({ type: "blob" })
                        .then(function(content) {
                            saveAs(content, "characters.zip");
                        });
                }
            } catch (err) {
                throw err;
            }
        }
    }

    // --
    //
    // Injection.
    //
    // --

    var InjectBodyTab = function() {
        if (PonyTownUtils.CharacterEditor.GetTab() === 0) {
            let bodyTab = document.querySelector("tabset > div > tab.active.tab-pane[heading='body'] > div > div");
            if (!bodyTab) return;

            bodyTab.prepend(document.createElement("hr"));

            bodyTab.prepend((() => {
                let Form = document.createElement("div");
                Form.classList.add("class", "row");
                Form.classList.add("class", "form-group");

                Form.append((() => {
                    let Description = document.createElement("div");
                    Description.classList.add("col-sm-4");

                    let Label = document.createElement("label");
                    Label.classList.add("control-label");
                    Label.innerHTML = "Import / Export";

                    Description.append(Label);
                    return Description;
                })());

                Form.append((() => {
                    let FormBody = document.createElement("div");
                    FormBody.classList.add("col-sm-8");

                    let ButtonGroup = document.createElement("div");
                    ButtonGroup.classList.add("btn-group");

                    let Import = document.createElement("label");
                    Import.classList.add("btn");
                    Import.classList.add("btn-primary");
                    Import.innerHTML = "Import";
                    Import.onclick = function() { UI.ShowImport(); };

                    let Export = document.createElement("label");
                    Export.classList.add("btn");
                    Export.classList.add("btn-primary");
                    Export.innerHTML = "Export";
                    Export.onclick = function() { UI.ShowExport(); };

                    /* let ExportAll = document.createElement("label");
                    ExportAll.classList.add("btn");
                    ExportAll.classList.add("btn-primary");
                    ExportAll.innerHTML = "Batch export";
                    ExportAll.onclick = function() { UI.ExportAll() }; 

                    ButtonGroup.append(ExportAll); */

                    ButtonGroup.append(Import);
                    ButtonGroup.append(Export);
                    FormBody.append(ButtonGroup);

                    let version = null,
                        version_tag = document.querySelector("footer.app-footer > div.clearfix > div.float-left.text-muted.text-nowrap");
                    if (version_tag.children[0] && version_tag.children[0].innerHTML)
                        version = version_tag.children[0].innerHTML;

                    if (version != targetPonyTownVersion) {
                        let div = document.createElement("div");
                        version = version ? version : "current version";

                        div.innerHTML = "Hold on!<br>Script wasn't tested with <b>" + version + "</b>.<br>Tested version was <b>" + targetPonyTownVersion + "</b>.";

                        let anchor = document.createElement("a");
                        anchor.setAttribute("target", "_blank");
                        anchor.setAttribute("href", githubScriptLink);
                        anchor.innerHTML = "Click here to check for updates.";

                        div.appendChild(document.createElement("br"));
                        div.appendChild(anchor);
                        FormBody.appendChild(div);
                    }
                    return FormBody;
                })());
                return Form;
            })());

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
})();
