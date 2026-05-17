import { CancelFrame, Frame } from "../frameloop/frame.js";
import { NumberValueTypes } from "../value/types/maps/number.js";
import { getValueAsType } from "../value/types/utils/get-as-type.js";
export class SognaflowValueState {
    constructor() {
        this.latest = {};
        this.values = new Map();
    }
    set(name, value, render, computed, useDefaultValueType = true) {
        const existingValue = this.values.get(name);
        if (existingValue) {
            existingValue.onRemove();
        }
        const onChange = () => {
            const v = value.get();
            if (useDefaultValueType) {
                this.latest[name] = getValueAsType(v, NumberValueTypes[name]);
            }
            else {
                this.latest[name] = v;
            }
            render && Frame.render(render);
        };
        onChange();
        const cancelOnChange = value.on("change", onChange);
        computed && value.addDependent(computed);
        const remove = () => {
            cancelOnChange();
            render && CancelFrame(render);
            this.values.delete(name);
            computed && value.removeDependent(computed);
        };
        this.values.set(name, { value, onRemove: remove });
        return remove;
    }
    get(name) {
        return this.values.get(name)?.value;
    }
}
//# sourceMappingURL=sognaflowvaluestate.js.map