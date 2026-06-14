import {
    acceleratedValues,
    SognaflowValue,
    transformProps,
    type WillChange,
} from "sognaflow-dom"

export class WillChangesognaflowValue
    extends SognaflowValue<string>
    implements WillChange
{
    private isEnabled = false

add(name: string) {
if (transformProps.has(name) || acceleratedValues.has(name)) {
            this.isEnabled = true
            this.update()
        }
    }

    private update() {
        this.set(this.isEnabled ? "transform" : "auto")
    }
}
