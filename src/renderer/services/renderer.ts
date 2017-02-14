import * as _ from 'lodash'
import {remote} from 'electron'
import {join} from 'path'
import * as Delir from 'delir-core'
import {ProjectHelper} from 'delir-core'

import dispatcher from '../dispatcher'
import {KnownPayload} from '../actions/PayloadTypes'

import EditorStateActions from '../actions/editor-state-actions'
import {DispatchTypes as EditorStateDispatchTypes} from '../actions/editor-state-actions'

let pluginRegistry: Delir.PluginRegistry|null = null
let pluginLoader: Delir.Services.PluginLoader|null = null
let renderer: Delir.Renderer|null = null
let audioContext: AudioContext|null = null
let audioBuffer: AudioBuffer|null = null
let audioBufferSource: AudioBufferSourceNode|null = null

let state: {
    project: Delir.Project.Project|null,
} = {
    project: null,
}

const handlePayload = (payload: KnownPayload) => {
    switch (payload.type) {
        case EditorStateDispatchTypes.SetActiveProject:
            renderer.setProject(payload.entity.project)
            state.project = payload.entity.project
            break

        case EditorStateDispatchTypes.TogglePreview: (() => {
            if (!state.project) return
            if (!renderer || !audioContext) return

            const targetComposition = ProjectHelper.findCompositionById(state.project, compositionId)
            if (! targetComposition) return


            if (renderer.isPlaying) {
                renderer.pause()
                return
            }

            audioBuffer = audioContext.createBuffer(
                targetComposition.audioChannels,
                /* length */targetComposition.samplingRate,
                /* sampleRate */targetComposition.samplingRate,
            )
            audioBufferSource = audioContext.createBufferSource()
            audioBufferSource.buffer = audioBuffer
            audioBufferSource.connect(audioContext.destination)
            audioBufferSource.start(0)

            renderer.setDestinationAudioBuffer(_.times(targetComposition.audioChannels, idx => audioBuffer!.getChannelData(idx)))

            console.log('begin render');
            let promise = renderer.render({
                beginFrame: 0,
                targetCompositionId: payload.entity.compositionId,
                throttle: true,
            })

            promise.progress(progress => {
                EditorStateActions.updateProcessingState(`Preview: ${progress.state}`)

                if (!audioBufferSource) return

                if (progress.isAudioBuffered) {
                    audioBufferSource.stop()
                    audioBufferSource.disconnect(audioContext!.destination)

                    audioBufferSource = audioContext!.createBufferSource()
                    audioBufferSource.buffer = audioBuffer
                    audioBufferSource.connect(audioContext!.destination)
                    audioBufferSource.start(0)
                }

                if (progress.isCompleted) {
                    audioBufferSource.stop()
                    audioBufferSource.disconnect(audioContext!.destination)
                    audioBufferSource = null
                    audioBuffer = null
                }
            })

            promise.catch((e: Error) => console.error(e.stack))
            })()
            break

        case EditorStateDispatchTypes.RenderDestinate: (() => {
            const file = remote.dialog.showSaveDialog(({
                title: 'Destinate',
                buttonLabel: 'Render',
                filters: [
                    {
                        name: 'mp4',
                        extensions: ['mp4']
                    }
                ],
            }))

            if (! file) return

            setTimeout(() => EditorStateActions.updateProcessingState(`Rendering: Initializing`), 0)

            const activeComp = ProjectHelper.findCompositionById(state.project, payload.entity.compositionId)
            if (! activeComp) {
                setTimeout(() => EditorStateActions.updateProcessingState(`Rendering: Composition not selected`), 0)
            } else {
                renderer.export({
                    exportPath: file,
                    tmpDir: remote.app.getPath('temp'),
                    targetCompositionId: activeComp.id,
                })
                .progress(progress => {
                    if (progress.isRendering) {
                        EditorStateActions.updateProcessingState(`Rendering: ${Math.floor(progress.finished * 100)}% ${progress.state}`)
                    } else {
                        EditorStateActions.updateProcessingState(`Rendering: ${progress.state}`)
                    }
                })
                .catch(e => console.error(e.stack))
            }
            })()
            break
    }
}

export default {
    initialize: async () => {
        audioContext = new AudioContext
        // scriptProcessor

        const userDir = remote.app.getPath('appData')
        pluginLoader = new Delir.Services.PluginLoader()
        pluginRegistry = new Delir.PluginRegistry()

        const loaded = [
            await pluginLoader.loadPackageDir(join(remote.app.getAppPath(), '/plugins')),
            await pluginLoader.loadPackageDir(join(userDir, '/delir/plugins')),
        ]

        console.log('Plugin loaded', [].concat(...loaded.map<any>(({loaded}) => loaded)));
        loaded.forEach(({loaded}) => pluginRegistry.addEntries(loaded))

        renderer = new Delir.Renderer({
            pluginRegistry: pluginRegistry,
        })

        renderer.setAudioContext(audioContext)
        dispatcher.register(handlePayload)
    },

    get pluginRegistry() {
        return pluginRegistry
    },

    get renderer() {
        return renderer
    }
}
