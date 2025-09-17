export default function HowToUse() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Como Usar o Auto Preenchimento</h1>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Salvando Formulários</h2>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                                <p className="text-blue-800">
                                    <strong>Passo 1:</strong> Navegue até a página com o formulário que deseja salvar
                                </p>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                                <p className="text-blue-800">
                                    <strong>Passo 2:</strong> Clique no ícone da extensão na barra de ferramentas do navegador
                                </p>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                                <p className="text-blue-800">
                                    <strong>Passo 3:</strong> Preencha os campos do formulário com os dados desejados
                                </p>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                <p className="text-blue-800">
                                    <strong>Passo 4:</strong> Clique no botão "Salvar" na extensão
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Preenchimento Automático</h2>
                            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                                <p className="text-green-800">
                                    <strong>Ativação:</strong> Ative o toggle "Ativar preenchimento automático" na extensão
                                </p>
                            </div>
                            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                                <p className="text-green-800">
                                    <strong>Uso:</strong> Quando visitar uma página com formulário salvo, os campos serão preenchidos automaticamente
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Botão Flutuante</h2>
                            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                                <p className="text-purple-800">
                                    <strong>Ativação:</strong> Ative o toggle "Ativar botão de preenchimento" na extensão
                                </p>
                            </div>
                            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                                <p className="text-purple-800">
                                    <strong>Uso:</strong> Uma bolinha azul aparecerá na tela que você pode arrastar para qualquer posição
                                </p>
                            </div>
                            <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                                <p className="text-purple-800">
                                    <strong>Preenchimento:</strong> Clique na bolinha para preencher automaticamente os campos da página atual
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Gerenciando Formulários Salvos</h2>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                <p className="text-yellow-800">
                                    <strong>Visualizar:</strong> Acesse a página "Formulários" para ver todos os formulários salvos
                                </p>
                            </div>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                <p className="text-yellow-800">
                                    <strong>Editar:</strong> Clique em "Editar" para modificar os valores salvos
                                </p>
                            </div>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <p className="text-yellow-800">
                                    <strong>Excluir:</strong> Clique em "Excluir" para remover um formulário salvo
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Dicas Importantes</h2>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                <li>Certifique-se de que os campos do formulário tenham atributos <code className="bg-gray-100 px-1 rounded">name</code> ou <code className="bg-gray-100 px-1 rounded">id</code></li>
                                <li>Campos do tipo radio, checkbox e select não são suportados para edição</li>
                                <li>O botão flutuante só funciona em páginas onde há formulários salvos</li>
                                <li>Você pode arrastar o botão flutuante para qualquer posição da tela</li>
                                <li>Os dados são salvos localmente no seu navegador</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
