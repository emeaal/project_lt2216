import "./styles.scss";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Machine, assign, actions, State } from "xstate";
import { useMachine, asEffect } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import { dmMachine } from "./dmvoicegame";

import createSpeechRecognitionPonyfill from 'web-speech-cognitive-services/lib/SpeechServices/SpeechToText'
import createSpeechSynthesisPonyfill from 'web-speech-cognitive-services/lib/SpeechServices/TextToSpeech';

const { send, cancel } = actions

const TOKEN_ENDPOINT = 'https://northeurope.api.cognitive.microsoft.com/sts/v1.0/issuetoken';
const REGION = 'northeurope';

inspect({
    url: "https://statecharts.io/inspect",
    iframe: false
});


const defaultPassivity = 10

const machine = Machine<SDSContext, any, SDSEvent>({
  id: "root",
  type: "parallel",
  states: {
    dm: {
        ...dmMachine
    },
    asrtts: {
      initial: "init",
      states: {
        init: {
          on: {
            CLICK: {
              actions: [
                assign({
                  audioCtx: (_ctx) =>
                    new ((window as any).AudioContext ||
                      (window as any).webkitAudioContext)(),
                }),
                (context) =>
                  navigator.mediaDevices
                    .getUserMedia({ audio: true })
                    .then(function (stream) {
                      context.audioCtx.createMediaStreamSource(stream);
                    }),
              ],
              target: "#root.asrtts.getToken",
            },
          },
        },
        getToken: {
          invoke: {
            src: (_ctx, _evt) => getAuthorizationToken(),
            id: "getAuthorizationToken",
            onDone: [
              {
                actions: [
                  assign((_context, event) => {
                    return { azureAuthorizationToken: event.data };
                  }),
                  "ponyfillASR",
                ],
                target: "#root.asrtts.ponyfillTTS",
              },
            ],
            onError: [
              {
                target: "#root.asrtts.fail",
              },
            ],
          },
        },
        ponyfillTTS: {
          invoke: {
            src: (context, _event) => (callback, _onReceive) => {
              const ponyfill = createSpeechSynthesisPonyfill({
                audioContext: context.audioCtx,
                credentials: {
                  region: REGION,
                  authorizationToken: context.azureAuthorizationToken,
                },
              });
              const { speechSynthesis, SpeechSynthesisUtterance } = ponyfill;
              context.tts = speechSynthesis;
              context.ttsUtterance = SpeechSynthesisUtterance;
              context.tts.addEventListener("voiceschanged", () => {
                context.tts.cancel();
                const voices = context.tts.getVoices();
                let voiceRe = RegExp("en-US", "u");
                if (process.env.REACT_APP_TTS_VOICE) {
                  voiceRe = RegExp(process.env.REACT_APP_TTS_VOICE, "u");
                }
                const voice = voices.find((voice) =>
                  /Ryan/u.test(voice.name)
                )!; //voices.find((v: any) => voiceRe.test(v.name))!
                if (voice) {
                  context.voice = voice;
                  callback("TTS_READY");
                } else {
                  console.error(
                    `TTS_ERROR: Could not get voice for regexp ${voiceRe}`
                  );
                  callback("TTS_ERROR");
                }
              });
            },
            id: "ponyTTS",
          },
          on: {
            TTS_READY: {
              target: "#root.asrtts.idle",
            },
            TTS_ERROR: {
              target: "#root.asrtts.fail",
            },
          },
        },
        idle: {
          on: {
            LISTEN: {
              target: "#root.asrtts.recognising",
            },
            SPEAK: {
              actions: assign((_context, event) => {
                return { ttsAgenda: event.value };
              }),
              target: "#root.asrtts.speaking",
            },
          },
        },
        recognising: {
          exit: "recStop",
          initial: "noinput",
          states: {
            noinput: {
              entry: [
                "recStart",
                send(
                  { type: "TIMEOUT" },
                  {
                    delay: (context) =>
                      500 * (context.tdmPassivity || defaultPassivity),
                    id: "timeout",
                  }
                ),
              ],
              exit: cancel("timeout"),
              on: {
                TIMEOUT: {
                  target: "#root.asrtts.idle",
                },
                STARTSPEECH: {
                  target: "#root.asrtts.recognising.inprogress",
                },
              },
            },
            inprogress: {},
            match: {
              entry: send("RECOGNISED"),
            },
            pause: {
              entry: "recStop",
              on: {
                CLICK: {
                  target: "#root.asrtts.recognising.noinput",
                },
              },
            },
          },
          on: {
            ASRRESULT: {
              actions: [
                "recLogResult",
                assign((_context, event) => {
                  return {
                    recResult: event.value,
                  };
                }),
              ],
              target: "#root.asrtts.recognising.match",
            },
            RECOGNISED: {
              target: "#root.asrtts.idle",
            },
            SELECT: {
              target: "#root.asrtts.idle",
            },
            CLICK: {
              target: "#root.asrtts.recognising.pause",
            },
          },
        },
        speaking: {
          entry: "ttsStart",
          exit: "ttsStop",
          on: {
            ENDSPEECH: {
              target: "#root.asrtts.idle",
            },
            SELECT: {
              target: "#root.asrtts.idle",
            },
            CLICK: {
              actions: send("ENDSPEECH"),
              target: "#root.asrtts.idle",
            },
          },
        },
        fail: {},
      },
    },
  },
},
    {
        actions: {
            recLogResult: (context: SDSContext) => {
                /* context.recResult = event.recResult; */ // .toLowerCase().replace(/\.$/, "") after utterance??
                console.log('U>', context.recResult[0]["utterance"].toLowerCase().replace(/\.$/, ""), context.recResult[0]["confidence"], context.recResult[0]["background"]);
            },
            logIntent: (context: SDSContext) => {
                /* context.nluData = event.data */
                console.log('<< NLU intent: ' + context.nluData.intent.name)
            }
        },
    });



interface Props extends React.HTMLAttributes<HTMLElement> {
    state: State<SDSContext, any, any, any>;
    alternative: any;
}
const ReactiveButton = (props: Props): JSX.Element => {
    var promptText = ((props.state.context.tdmVisualOutputInfo || [{}])
        .find((el: any) => el.attribute === "name") || {}).value;
    var promptImage = ((props.state.context.tdmVisualOutputInfo || [{}])
        .find((el: any) => el.attribute === "image") || {}).value;
    var circleClass = "circle"
    switch (true) {
        case props.state.matches({ asrtts: 'fail' }) || props.state.matches({ dm: 'fail' }):
            break;
        case props.state.matches({ asrtts: { recognising: 'pause' } }):
            promptText = "Click to continue"
            break;
        case props.state.matches({ asrtts: 'recognising' }):
            circleClass = "circle-recognising"
            promptText = promptText || 'Listening...'
            break;
        case props.state.matches({ asrtts: 'speaking' }):
            circleClass = "circle-speaking"
            promptText = promptText || 'Speaking...'
            break;
        case props.state.matches({ dm: 'idle' }):
            promptText = "Welcome to the game! Click the circle to start"
            circleClass = "circle-click"
            break;
        case props.state.matches({ dm: 'init' }):
            promptText = "Welcome to the game! Click the circle to start"
            circleClass = "circle-click"
            break;
        default:
            promptText = promptText || '\u00A0'
    }
    return (
        <div className="control">
            <figure className="prompt">
                {promptImage &&
                    <img src={promptImage}
                        alt={promptText} />}
            </figure>
            <div className="status">
                <button type="button" className={circleClass}
                    style={{}} {...props}>
                </button>
                <div className="status-text">
                    {promptText}
                </div>
            </div>
        </div>);
}

const FigureButton = (props: Props): JSX.Element => {
    const caption = props.alternative.find((el: any) => el.attribute === "name").value
    const imageSrc = (props.alternative.find((el: any) => el.attribute === "image") || {}).value
    return (
        <figure className="flex" {...props}>
            {imageSrc &&
                <img src={imageSrc} alt={caption} />}
            <figcaption>{caption}</figcaption>
        </figure>
    )
}

function App() {
    const [current, send] = useMachine(machine, {
        devTools: true,
        actions: {

            changeBackground: asEffect((context) => {
                console.log(context.background)
                document.body.style.backgroundImage =  `url('${context.background}')`
                /* console.log('Ready to receive a voice input.'); */
            }),

            recStart: asEffect((context) => {
                context.asr.start()
                /* console.log('Ready to receive a voice input.'); */
            }),
            recStop: asEffect((context) => {
                context.asr.abort()
                /* console.log('Recognition stopped.'); */
            }), 
            ttsStart: asEffect((context) => {
                let content = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${context.voice.name}">`
                content = content + (process.env.REACT_APP_TTS_LEXICON ? `<lexicon uri="${process.env.REACT_APP_TTS_LEXICON}"/>` : "")
                content = content + `${context.ttsAgenda}</voice></speak>`
                console.debug(content)
                const utterance = new context.ttsUtterance(context.ttsAgenda);
                console.log("S>", context.ttsAgenda)
                utterance.voice = context.voice
                utterance.onend = () => send('ENDSPEECH')
                context.tts.speak(utterance)
            }),
            ttsStop: asEffect((context) => {
                /* console.log('TTS STOP...'); */
                context.tts.cancel()
            }),
            ponyfillASR: asEffect((context, _event) => {
                const
                    { SpeechRecognition }
                        = createSpeechRecognitionPonyfill({
                            audioContext: context.audioCtx,
                            credentials: {
                                region: REGION,
                                authorizationToken: context.azureAuthorizationToken,
                            }
                        });
                context.asr = new SpeechRecognition()
                context.asr.lang = process.env.REACT_APP_ASR_LANGUAGE || 'en-US'
                context.asr.continuous = true
                context.asr.interimResults = true
                context.asr.onresult = function(event: any) {
                    var result = event.results[0]
                    if (result.isFinal) {
                        send({
                            type: "ASRRESULT", value:
                                [{
                                    "utterance": result[0].transcript,
                                    "confidence": result[0].confidence,
                                    "background": result[0].background
                                }]
                        })
                    } else {
                        send({ type: "STARTSPEECH" });
                    }
                }

            })
        },
    });
    
    const figureButtons = (current.context.tdmExpectedAlternatives || []).filter((o: any) => o.visual_information)
        .map(
            (o: any, i: any) => (
                <FigureButton state={current}
                    alternative={o.visual_information}
                    key={i}
                    onClick={() => send({ type: 'SELECT', value: o.semantic_expression })} />
            )
        )

    switch (true) {
        default:
            return (
                <div className="App">
                    <ReactiveButton state={current} alternative={{}} onClick={() => send('CLICK')} />
                    <div className="select-wrapper">
                        <div className="select">
                            {figureButtons}
                        </div>
                    </div>
                </div>
            )
    }};

const getAuthorizationToken = () => (
    fetch(new Request(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.REACT_APP_SUBSCRIPTION_KEY!
        },
    })).then(data => data.text()))


const rootElement = document.getElementById("root");
ReactDOM.render(
    <App />,
    rootElement);