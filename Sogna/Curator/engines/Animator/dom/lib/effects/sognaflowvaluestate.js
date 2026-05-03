import { CancelFrame as cancelFrame, Frame as frame } from "../frameloop/frame";
import { NumberValueTypes as numberValueTypes } from "../value/types/maps/number";
import { GetValueAsType as getValueAsType } from "../value/types/utils/get-as-type";
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
                this.latest[name] = getValueAsType(v, numberValueTypes[name]);
            }
            else {
                this.latest[name] = v;
            }
            render && frame.render(render);
        };
        onChange();
        const cancelOnChange = value.on("change", onChange);
        computed && value.addDependent(computed);
        const remove = () => {
            cancelOnChange();
            render && cancelFrame(render);
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
//# sourceMappingURL=SognaflowValueState.js.map