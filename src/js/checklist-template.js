function limparModeloChecklist(){
    document.querySelectorAll('.checklist-template-paper input').forEach(input => {
        if(input.type === 'checkbox'){
            input.checked = false
            return
        }
        input.value = ''
    })
    document.querySelectorAll('.checklist-template-paper textarea').forEach(textarea => {
        textarea.value = ''
    })
    preencherDataAtual()
}

function preencherDataAtual(){
    const campoData = document.querySelector('.checklist-template-paper input[name="data"]')
    if(campoData && !campoData.value){
        campoData.value = new Date().toISOString().slice(0, 10)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    preencherDataAtual()
    document.getElementById('btnImprimirModeloChecklist')?.addEventListener('click', () => window.print())
    document.getElementById('btnLimparModeloChecklist')?.addEventListener('click', limparModeloChecklist)
})
