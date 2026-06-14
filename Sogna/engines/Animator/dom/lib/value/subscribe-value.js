import { CancelFrame, Frame } from "../frameloop";
export function SubscribeValue(inputValues, outputValue, getLatest) {
    const update = () => outputValue.set(getLatest());
    const scheduleUpdate = () => Frame.preRender(update, false, true);
    const subscriptions = inputValues.map((v) => v.on("change", scheduleUpdate));
    outputValue.on("destroy", () => {
        subscriptions.forEach((unsubscribe) => unsubscribe());
        CancelFrame(update);
    });
}
//# sourceMappingURL=subscribe-value.js.map