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
                                    <strong>Uso:</strong> O botão flutuante possui duas funcionalidades: uma bolinha
                                    azul para preencher automaticamente o formulário e uma bolinha verde para salvar os
                                    dados. Ambos os botões podem ser arrastados para qualquer posição na tela.
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
                    </div>
                </div>
            </div>
        </div>
    );
}
