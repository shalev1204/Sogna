import { acceleratedValues, SognaflowValue, transformProps, } from "sognaflow-dom";
export class WillChangesognaflowValue extends SognaflowValue {
    constructor() {
        super(...arguments);
        this.isEnabled = false;
    }
    add(name) {
        if (transformProps.has(name) || acceleratedValues.has(name)) {
            this.isEnabled = true;
            this.update();
        }
    }
    update() {
        this.set(this.isEnabled ? "transform" : "auto");
    }
}
//# sourceMappingURL=willchangesognaflowvalue.js.map