import {
    SetActiveProjectPayload,
    SetDragEntityPayload,
    ClearDragEntityPayload,
    ChangeActiveCompositionPayload,
    ChangeActiveLayerPayload,
    TogglePreviewPayload,
    RenderDestinatePayload,
    UpdateProcessingState,
} from './editor-state-actions'

import {
    CreateCompositionPayload,
    CreateTimelanePayload,
    CreateLayerPayload,
    AddTimelanePayload,
    AddAssetPayload,
    MoveLayerToTimelanePayload,
    ModifyCompositionPayload,
    ModifyLayerPayload,
    RemoveTimelanePayload,
    RemoveLayerPayload,
} from './project-modify-actions'

export type EditorStateActionPayload =
    SetActiveProjectPayload
    | SetDragEntityPayload
    | ClearDragEntityPayload
    | ChangeActiveCompositionPayload
    | ChangeActiveLayerPayload
    | TogglePreviewPayload
    | RenderDestinatePayload
    | UpdateProcessingState

export type ProjectModifyActionPayload =
    CreateCompositionPayload
    | CreateTimelanePayload
    | CreateLayerPayload
    | AddTimelanePayload
    | AddAssetPayload
    | MoveLayerToTimelanePayload
    | ModifyCompositionPayload
    | ModifyLayerPayload
    | RemoveTimelanePayload
    | RemoveLayerPayload

export type KnownPayload = EditorStateActionPayload | ProjectModifyActionPayload