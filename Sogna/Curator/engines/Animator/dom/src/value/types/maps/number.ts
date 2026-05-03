import { Int } from "../int"
import { Alpha } from "../numbers"
import { Px } from "../numbers/units"
import { TransformValueTypes } from "./transform"
import { ValueTypeMap } from "./types"

export const NumberValueTypes: ValueTypeMap = {
    // Border props
    borderWidth: Px,
    borderTopWidth: Px,
    borderRightWidth: Px,
    borderBottomWidth: Px,
    borderLeftWidth: Px,
    borderRadius: Px,
    borderTopLeftRadius: Px,
    borderTopRightRadius: Px,
    borderBottomRightRadius: Px,
    borderBottomLeftRadius: Px,

    // Positioning props
    width: Px,
    maxWidth: Px,
    height: Px,
    maxHeight: Px,
    top: Px,
    right: Px,
    bottom: Px,
    left: Px,
    inset: Px,
    insetBlock: Px,
    insetBlockStart: Px,
    insetBlockEnd: Px,
    insetInline: Px,
    insetInlineStart: Px,
    insetInlineEnd: Px,

    // Spacing props
    padding: Px,
    paddingTop: Px,
    paddingRight: Px,
    paddingBottom: Px,
    paddingLeft: Px,
    paddingBlock: Px,
    paddingBlockStart: Px,
    paddingBlockEnd: Px,
    paddingInline: Px,
    paddingInlineStart: Px,
    paddingInlineEnd: Px,
    margin: Px,
    marginTop: Px,
    marginRight: Px,
    marginBottom: Px,
    marginLeft: Px,
    marginBlock: Px,
    marginBlockStart: Px,
    marginBlockEnd: Px,
    marginInline: Px,
    marginInlineStart: Px,
    marginInlineEnd: Px,

    // Typography
    fontSize: Px,

    // Misc
    backgroundPositionX: Px,
    backgroundPositionY: Px,

    ...TransformValueTypes,
    zIndex: Int,

    // SVG
    fillOpacity: Alpha,
    strokeOpacity: Alpha,
    numOctaves: Int,
}
