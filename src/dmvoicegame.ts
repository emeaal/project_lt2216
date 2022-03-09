import { MachineConfig, send, Action } from "xstate";


const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult[0].utterance}` // not needed
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

const menugrammar: { [index: string]: { beach?: string, forest?: string} } = {
    "It's a beach.": {beach: "Beach" },
    "A beach": {beach: "Beach"},
    "A forest": {forest: "Forest" },
    "It's a forest.": {forest: "Forest" },

}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {
        idle: {
            on: {
                CLICK: 'init'
            }
        },
        init: {
            on: {
                TTS_READY: 'welcome',
                CLICK: 'welcome'
            }
        },

        welcome: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {   target: 'forest',
                        cond: (context) => "forest" in (menugrammar[context.recResult[0].utterance] || {})},
                    { target: 'stop' }],
                TIMEOUT: '..',
            },
            states: {
                prompt: {
                    entry: say("Welcome! You wake up and find yourself in a strange place. But you can’t quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think?"),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: send('LISTEN'),
                },
            }
        },
        stop: {
            entry: say("Ok"),
            always: 'init'
        },
        forest: {
            initial: 'prompt',
            states: {
                prompt: {
                    entry: sayColour,
                    on: { ENDSPEECH: 'repaint' }
                },
                repaint: {
                    entry: 'changeColour',
                    always: '#root.dm.welcome'
                }
            }
        }
    }
})
