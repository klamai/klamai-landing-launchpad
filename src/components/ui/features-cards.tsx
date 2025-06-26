
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Users, Zap, MessageCircle, Scale, Clock } from 'lucide-react'

export function FeaturesCards() {
    return (
        <section className="bg-gray-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-3xl lg:max-w-5xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        ¿Por qué elegir klamAI?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
                        Descubre las ventajas de nuestro servicio de asesoramiento jurídico con tecnología IA
                    </p>
                </div>
                
                <div className="relative">
                    <div className="relative z-10 grid grid-cols-6 gap-3">
                        {/* IA Avanzada - Card Principal */}
                        <Card className="relative col-span-full flex overflow-hidden lg:col-span-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800">
                            <CardContent className="relative m-auto size-fit pt-6">
                                <div className="relative flex h-24 w-56 items-center">
                                    <svg className="text-blue-300 dark:text-blue-700 absolute inset-0 size-full" viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    <span className="mx-auto block w-fit text-5xl font-semibold text-blue-600 dark:text-blue-400">IA</span>
                                </div>
                                <h2 className="mt-6 text-center text-3xl font-semibold text-blue-800 dark:text-blue-300">Tecnología Avanzada</h2>
                            </CardContent>
                        </Card>

                        {/* Seguridad */}
                        <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
                            <CardContent className="pt-6">
                                <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-green-300 dark:border-green-700 before:absolute before:-inset-2 before:rounded-full before:border before:border-green-200 dark:before:border-green-800">
                                    <Shield className="m-auto h-12 w-12 text-green-600 dark:text-green-400" strokeWidth={1.5} />
                                </div>
                                <div className="relative z-10 mt-6 space-y-2 text-center">
                                    <h2 className="text-lg font-medium text-green-800 dark:text-green-300">Seguridad Garantizada</h2>
                                    <p className="text-green-700 dark:text-green-400">Tus datos están protegidos con los más altos estándares de seguridad y confidencialidad.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Respuesta Rápida */}
                        <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border-purple-200 dark:border-purple-800">
                            <CardContent className="pt-6">
                                <div className="pt-6 lg:px-6">
                                    <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-purple-300 dark:border-purple-700 before:absolute before:-inset-2 before:rounded-full before:border before:border-purple-200 dark:before:border-purple-800">
                                        <MessageCircle className="m-auto h-12 w-12 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="relative z-10 mt-6 space-y-2 text-center">
                                    <h2 className="text-lg font-medium text-purple-800 dark:text-purple-300">Respuesta Inmediata</h2>
                                    <p className="text-purple-700 dark:text-purple-400">VitorIA te responde al instante, disponible 24/7 para todas tus consultas legales.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Especialistas */}
                        <Card className="relative col-span-full overflow-hidden lg:col-span-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200 dark:border-orange-800">
                            <CardContent className="grid pt-6 sm:grid-cols-2">
                                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                    <div className="relative flex aspect-square size-12 rounded-full border border-orange-300 dark:border-orange-700 before:absolute before:-inset-2 before:rounded-full before:border before:border-orange-200 dark:before:border-orange-800">
                                        <Users className="m-auto size-6 text-orange-600 dark:text-orange-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-medium text-orange-800 dark:text-orange-300">Especialistas Expertos</h2>
                                        <p className="text-orange-700 dark:text-orange-400">Nuestro equipo de abogados especialistas está disponible para resolver tus consultas más complejas.</p>
                                    </div>
                                </div>
                                <div className="relative -mb-6 -mr-6 mt-6 h-fit border-l border-t border-orange-200 dark:border-orange-800 p-6 py-6 sm:ml-6 rounded-tl-lg">
                                    <div className="absolute left-3 top-2 flex gap-1">
                                        <span className="block size-2 rounded-full bg-orange-400 dark:bg-orange-600"></span>
                                        <span className="block size-2 rounded-full bg-orange-300 dark:bg-orange-700"></span>
                                        <span className="block size-2 rounded-full bg-orange-200 dark:bg-orange-800"></span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Scale className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            <span className="text-sm text-orange-700 dark:text-orange-300">Derecho Civil</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Scale className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            <span className="text-sm text-orange-700 dark:text-orange-300">Derecho Laboral</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Scale className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            <span className="text-sm text-orange-700 dark:text-orange-300">Derecho Penal</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Disponibilidad 24/7 */}
                        <Card className="relative col-span-full overflow-hidden lg:col-span-3 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50 border-teal-200 dark:border-teal-800">
                            <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                    <div className="relative flex aspect-square size-12 rounded-full border border-teal-300 dark:border-teal-700 before:absolute before:-inset-2 before:rounded-full before:border before:border-teal-200 dark:before:border-teal-800">
                                        <Clock className="m-auto size-6 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-medium text-teal-800 dark:text-teal-300">Disponible 24/7</h2>
                                        <p className="text-teal-700 dark:text-teal-400">Atención virtual las 24 horas, todos los días del año. Tu consulta no puede esperar.</p>
                                    </div>
                                </div>
                                <div className="relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px before:bg-teal-200 dark:before:bg-teal-800 sm:-my-6 sm:-mr-6">
                                    <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                                        <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                            <span className="block h-fit rounded border border-teal-200 dark:border-teal-700 bg-teal-100 dark:bg-teal-900 px-2 py-1 text-xs text-teal-800 dark:text-teal-200">24h</span>
                                            <div className="ring-white dark:ring-gray-900 size-7 ring-4 bg-teal-500 rounded-full flex items-center justify-center">
                                                <Zap className="h-3 w-3 text-white" />
                                            </div>
                                        </div>
                                        <div className="relative ml-[calc(50%-1rem)] flex items-center gap-2">
                                            <div className="ring-white dark:ring-gray-900 size-8 ring-4 bg-teal-600 rounded-full flex items-center justify-center">
                                                <MessageCircle className="h-4 w-4 text-white" />
                                            </div>
                                            <span className="block h-fit rounded border border-teal-200 dark:border-teal-700 bg-teal-100 dark:bg-teal-900 px-2 py-1 text-xs text-teal-800 dark:text-teal-200">VitorIA</span>
                                        </div>
                                        <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                            <span className="block h-fit rounded border border-teal-200 dark:border-teal-700 bg-teal-100 dark:bg-teal-900 px-2 py-1 text-xs text-teal-800 dark:text-teal-200">365 días</span>
                                            <div className="ring-white dark:ring-gray-900 size-7 ring-4 bg-teal-500 rounded-full flex items-center justify-center">
                                                <Clock className="h-3 w-3 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}
