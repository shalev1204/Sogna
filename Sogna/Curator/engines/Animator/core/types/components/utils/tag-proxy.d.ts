import { ComponentType, PropsWithChildren } from "react";
export type CreateComponent<Props> = (key: string | ComponentType<PropsWithChildren<Props>>) => ComponentType<PropsWithChildren<Props>>;
type BindProps<ComponentProps, TagProps> = ComponentProps & Omit<TagProps, keyof ComponentProps>;
type BoundComponents<ComponentProps, TagsWithProps> = {
    [K in keyof TagsWithProps]: ComponentType<PropsWithChildren<BindProps<ComponentProps, TagsWithProps[K]>>>;
};
export declare function tagProxy<ComponentProps extends {}, TagsWithProps>(createComponent: CreateComponent<ComponentProps>): (<TagProps>(Component: ComponentType<any>) => ComponentType<PropsWithChildren<BindProps<ComponentProps, TagProps>>>) & BoundComponents<ComponentProps, TagsWithProps>;
export {};
