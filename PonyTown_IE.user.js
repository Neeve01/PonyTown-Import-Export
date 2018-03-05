// ==UserScript==
// @name        PonyTown Import/Export
// @namespace   azedith
// @include     https://pony.town/*

// @author      Neeve
// @version     0.31.0pre1
// @copyright   2017, Neeve (https://openuserjs.org/users/Neeve)
// @license     MIT

// @grant       GM_addStyle
// @grant       unsafeWindow

// @require     https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @require     https://raw.githubusercontent.com/Neeve01/PonyTown-Import-Export/master/ponytown_utils.js
// @require     https://cdn.jsdelivr.net/npm/clipboard@1/dist/clipboard.min.js

// @updateURL   https://openuserjs.org/meta/Neeve/PonyTown_ImportExport.meta.js
// ==/UserScript==

(function() {
    'use strict';

    var observer_target = document.querySelector("pony-town-app");

    if (!observer_target) {
        return;
    }

    var Resources = {
        ['css']: `
        .nmw-overlay{background-color:rgba(51,51,51,0.7);position:fixed;width:100%;height:100%;left:0;top:0;z-index:99999;align-items:center}
        .nmw-overlay:not(:empty){display:flex}
        .nmw-overlay:empty{display:none}
        .nmw-overlay .nmw-form{display:inline-block;position:absolute;transform:translate(-50%,0);width:45vw;min-width:32rem;left:50%;background:#212121;font-family:Helvetica Neue,Helvetica,Arial,sans-serif}
        .nmw-overlay .nmw-form .nmw-contents{border:1px solid #9d603b;border-top:none;padding:.75% 1% .25%}
        .nmw-overlay .nmw-textarea{font-size:.9em;resize:none;display:block;margin-left:auto;margin-right:auto;width:100%;height:50vh}
        .nmw-overlay .nmw-form .nmw-text{display:block;text-align:center;font-size:1.25em;color:#CCC!important;font-weight:700}
        .nmw-overlay .nmw-warning{display:block;text-align:center;font-size:1em;line-height:150%;color:#CA7E4E!important;font-weight:700}
        .nmw-overlay hr{border:0;border-top:1px solid #555;margin-top:.5rem;margin-bottom:.5rem}
        .nmw-overlay .nmw-form .nmw-line-center{display:flex;justify-content:center}
        .nmw-overlay .nmw-input{width:.1px;height:.1px;opacity:0;overflow:hidden;position:absolute;z-index:-1}
        .nmw-overlay .nmw-link{text-decoration:none}
        .nmw-overlay .nmw-link i{fill:#9d603b;font-size:.9em}
        .nmw-overlay .nmw-form .nmw-btn-close{border:0 solid;background:#CA7E4E;width:2em;height:2em;padding:0;margin:0;color:#FFF;font-size:.75em;border-radius:0}
        .nmw-overlay .nmw-form .nmw-btn-wide{width:100%}
        .nmw-overlay .nmw-inpad{padding-left:1%;padding-right:1%}
        .nmw-overlay .nmw-header{margin:0;padding:0;background:#9d603b;text-align:center;line-height:150%;font-size:1.1em;color:#fff;font-weight:400;padding-left:1%;margin:0}
        .nmw-overlay .nmw-row{display:flex;justify-content:space-between}
        .nmw-overlay .nmw-row .nmw-col{padding:0;margin:0}
        .nmw-overlay .nmw-form .nmw-footer{position:absolute;bottom:0;right:0;transform:translate(0,100%);padding-top:0.15em;font-weight:700}
        .nmw-overlay .nmw-form .nmw-footer .nmw-elements{display:flex;justify-content:flex-end;line-height:1;color:#CA7E4E!important;font-size:.75em}
        #nmw-button-download{fill:#CCC}
        .nmw-span-dimmable{transition:all 1.25s ease-in-out;opacity:1}
        .nmw-span-dim{opacity:.65}
        .nmw-char-preview-controls{transform:translate(0,-100%);padding:0.25rem;position:absolute;top:100%;right: 0;}
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
                <label style="margin-bottom:0" class="nmw-text">Paste your character code inside and press Import.</label>
                <label class="nmw-warning">Careful! This will erase current character settings.</label>
            </div>
            <input id="nmw-file" class="nmw-input" accept=".json,.txt" type="file">
            <div class="nmw-line-center">
                <label style="min-width: 12.5rem" id="nmw-button-import" class="btn btn-primary">
                    <i class="fas fa-align-center"></i>
                    <span class="nmw-span-dimmable">Import</span>
                </label>
                <label for="nmw-file" style="margin-left:1rem;min-width: 12.5rem" id="nmw-button-download" class="btn btn-primary">
                    <i class="fas fa-upload"></i>
                    <span>Import from file</span>
                </label>
            </div>
        </div>
        <div class="nmw-footer">
            <div class="nmw-elements">
                <span class="mr-1">Import/Export © NotMyWing</span>
                <a target="_blank" href="https://twitter.com/NotMyWing" class="mr-1 nmw-link">
                    <i class="fab fa-twitter"></i>    
                </a>
                <a target="_blank" href="https://github.com/Neeve01" class="nmw-link">
                    <i class="fab fa-github"></i>    
                </a>
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
            <div style="margin-bottom:0.5rem" class="nmw-line-center">
                <button style="min-width: 10.5rem" id="nmw-button-copy" class="btn btn-primary">
                    <i class="fas fa-clipboard"></i>
                    <span class="nmw-span-dimmable">Copy to clipboard</span>
                </button>

                <button style="margin-left:1rem;min-width: 10.5rem" id="nmw-button-download" class="btn btn-primary">
                    <i class="fas fa-download"></i>
                    <span>Download as file</span>
                </button>
            </div>
        </div>
        <div class="nmw-footer">
            <div class="nmw-elements">
                <span class="mr-1">Import/Export © NotMyWing</span>
                <a target="_blank" href="https://twitter.com/NotMyWing" class="mr-1 nmw-link">
                    <i class="fab fa-twitter"></i>    
                </a>
                <a target="_blank" href="https://github.com/Neeve01" class="nmw-link">
                    <i class="fab fa-github"></i>    
                </a>
            </div>
        </div>
        `
    }
    GM_addStyle(Resources["css"]);

    var debugging = false;

    var targetPonyTownVersion = "0.30.1-alpha";
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

                    if (!pixels) {
                        return;
                    }
                    if (pixels.every((e) => e === "")) {
                        return;
                    }

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

                setup.SetEyes = (values) => {
                    return this.SetEyes(values);
                }
                setup.GetEyes = () => {
                    return this.GetEyes;
                }

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

                for (let i in this.TabFunctions) {
                    let v = this.TabFunctions[i];

                    if (v.Tab === current_tab) {
                        let _container = container.querySelector("div.active.tab-pane");
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
                    let container = document.querySelector("tabset > div > div.active.tab-pane");
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
            if (typeof(data) == "string") {
                data = JSON.parse(data);
            }
            data.Body = data.Body || {};

            await PonyTownUtils.CharacterEditor.SetTab(0);
            (await this.SetupFunctions()).CustomOutlines = data.Body.OutlinesEnabled || false;

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
        },
        ExportAll: async function() {
            var zip = new JSZip();
            var used_filenames = [];

            try {
                let list = await PonyTownUtils.CharacterEditor.GetCharacterList();
                if (list) {
                    let unknown_count = 0;
                    for (let i = 0; i < list.length; i++) {
                        await PonyTownUtils.CharacterEditor.SelectCharacter(i);
                        let data = JSON.stringify(await Character.Export());
                        let name,
                            used_count = 0;

                        do {
                            let used_suffix = "";
                            if (used_count > 0) {
                                used_suffix = "." + used_count;
                            }

                            name = (list[i] || "unknown-" + (++unknown_count)).replace(/[^a-z0-9]/gi, '_').toLowerCase() + used_suffix;
                            used_count++;
                        } while (used_filenames.includes(name));
                        used_filenames.push(name);

                        zip.file(name + ".pt.json", data);
                    }
                    zip.generateAsync({
                            type: "blob"
                        })
                        .then(function(content) {
                            saveAs(content, "characters.zip");
                        });
                }
            } catch (err) {
                throw err;
            }
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
        var html = Resources["import-frame"],
            import_btn,
            form;

        function form(overlay) {
            form = this;
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
                else {
                    form.ImportFail("Input is empty! •`c´•");
                }
            };
            import_btn = import_button;

            let fileinput = this.container.querySelector("input");
            fileinput.onchange = function() {
                let file = fileinput.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.readAsText(file, "UTF-8");
                    reader.onload = function(evt) {
                        if (evt.target.result)
                            form.Import(evt.target.result, true);
                    }
                }
            }

            textarea.select();
        }

        let timer_handle;
        form.prototype.ImportFail = function(msg) {
            msg = msg || "Couldn't import ´• c •`";
            let span = import_btn.querySelector("span");

            span.innerHTML = msg;
            if (!span.classList.contains("nmw-span-dim"))
                span.classList.add("nmw-span-dim");

            clearTimeout(timer_handle);
            timer_handle = setTimeout(function() {
                if (span) {
                    import_btn.querySelector("span").innerHTML = "Import";
                    span.classList.remove("nmw-span-dim");
                }
            }, 3500);
        }

        form.prototype.Import = async function(data, force_close) {
            try {
                await Character.Import(data);

                // Let it close if import was successful.
                force_close = true;
            } catch (err) {
                form.ImportFail();
                throw err;
            } finally {
                if (force_close)
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

            this.container.innerHTML = html;

            this.container.classList.add("nmw-form");
            let textarea = this.container.querySelector("textarea");
            textarea.value = data;

            let button = this.container.querySelector("[id='nmw-button-close']");
            button.onclick = function() {
                form.Close();
            }

            let copy_button = this.container.querySelector("[id='nmw-button-copy']");
            let cpb = new Clipboard(copy_button, {
                text: function(trigger) {
                    return textarea.value;
                }
            });

            let timer_handle;
            cpb.on("success", function(e) {
                let span = copy_button.querySelector("span");
                span.innerHTML = "Copied!";
                if (!span.classList.contains("nmw-span-dim"))
                    span.classList.add("nmw-span-dim");

                clearTimeout(timer_handle);
                timer_handle = setTimeout(function() {
                    if (span) {
                        copy_button.querySelector("span").innerHTML = "Copy to clipboard";
                        span.classList.remove("nmw-span-dim");
                    }
                }, 3500);
            });

            let dl = this.container.querySelector("[id='nmw-button-download']");
            dl.onclick = function() {
                let name = document.querySelector("character-select > div > input");
                name = (name ? name.value : "character") + ".pt.json";

                var blob = new Blob([textarea.value], {
                    type: "application/json"
                });
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
        InjectHTML: function() {
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
        }
    }

    // --
    //
    // Injection.
    //
    // --

    var InjectControls = function(el) {
        let preview = el.querySelector(".character-preview-box > character-preview").parentNode;

        let controls = document.createElement("div");
        controls.classList.add("nmw-char-preview-controls");
        controls.setAttribute("nmw", "");
        preview.append(controls);

        let import_btn = document.createElement("button");
        import_btn.classList.add("btn");
        import_btn.classList.add("btn-default");
        import_btn.innerHTML = '<i class="fas mr-1 fa-cloud-upload"></i>Import';
        controls.appendChild(import_btn);

        let export_btn = document.createElement("button");
        export_btn.classList.add("btn");
        export_btn.classList.add("btn-default");
        export_btn.classList.add("ml-1");
        export_btn.innerHTML = '<i class="fas mr-1 fa-cloud-download"></i>Export';
        controls.appendChild(export_btn);

        import_btn.onclick = function() {
            UI.ShowImport();
        };
        export_btn.onclick = function() {
            UI.ShowExport();
        };
    };

    // Set observer.
    var observer = new MutationObserver(function(mutations) {
        let controls_injected = false;
        let overlay_changed = false;

        for (var i = 0; i < mutations.length; i++) {
            let element = mutations[i].target;
            if (!overlay_changed && element.classList.contains("nmw-overlay")) {
                overlay_changed = true;

                let body = document.querySelector("body");
                if (element.childNodes.length > 0) {
                    body.style.overflow = "hidden";
                } else {
                    body.style.overflow = "";
                }
            }

            if (!controls_injected && mutations[i].removedNodes.length === 0 && element.tagName == "CHARACTER") {
                if (!element.querySelector('[nmw]')) {
                    InjectControls(element);
                }
                controls_injected = true;
            }
        }
    });
    observer.observe(observer_target.parentNode, {
        childList: true,
        subtree: true,
        attributes: true
    });

    if (unsafeWindow) {
        unsafeWindow.NMW = unsafeWindow.NMW || {};
        unsafeWindow.NMW.PonyTownUtils = PonyTownUtils;
        unsafeWindow.NMW.Character = Character;
    }
})();
