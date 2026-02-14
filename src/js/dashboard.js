
// Calcular superficie corporal
function superficieCorporal(peso, altura){
    return Math.sqrt((peso * altura) / 3600).toFixed(2)
}

// Calcular oferta de oxigênio
function ofertaOxigenio(hemoglobina, sao2, fluxo, SC){
    const cao2 = hemoglobina * 1.34 * sao2
    const do2 = fluxo * cao2 * 10
    return (do2 / SC).toFixed(2)
}

//Calcular Índice cardíaco
function indiceCardiaco(fluxo, SC){
    return (fluxo / SC).toFixed(2)
}



document.addEventListener('DOMContentLoaded', () => {
    const paciente = JSON.parse(localStorage.getItem('paciente'))

    //Validar se eiste a variável
    if(!paciente){
        alert('Nenhum dado do paciente encontrado, Volte a página inicial e inicie uma nova simulação!')
        window.location.href = 'index.html'
        return
    }

    //Resgatar as variáveis
    const idade = Number(paciente.idade)
    const peso = Number(paciente.peso)
    const altura = Number(paciente.alturaNum)
    const sao2 = Number(paciente.sao2) / 100
    const hemoglobina = paciente.hemoglobina
    const fluxo = paciente.fluxo
    const hct = paciente.hematocrito
    const lactato = paciente.lactato

    //Resgatar e imprimir os dados
    const campoSexo = document.getElementById('campoSexo')
    const campoIdade = document.getElementById('campoIdade')
    const campoPeso = document.getElementById('campoPeso')
    const campoSC = document.getElementById('campoSC')
    const campoido2 = document.getElementById('campoido2')
    const campoHb = document.getElementById('campoHb')
    const campoHct = document.getElementById('campoHct')
    const campoLactato = document.getElementById('campoLactato')
    const campoIC = document.getElementById('campoIC')

    //Conteúdo Header
    campoSexo.textContent = `Paciente: ${paciente.sexo}`
    campoIdade.textContent = `${idade} anos`
    campoPeso.textContent = `${peso} Kg`

    //Conteúdo cards
    campoHb.textContent = hemoglobina
    campoHct.textContent = hct
    campoLactato.textContent = lactato

    //Superfície Corporal
    const SC = superficieCorporal(peso,altura)
    campoSC.textContent = `SC: ${SC} m²`

    //Oferta de oxigênio iDO²
    const ido2 = ofertaOxigenio(hemoglobina, sao2, fluxo, SC)
    campoido2.textContent = ido2
    console.log(ido2)

    //Índice cardíaco
    const IC = indiceCardiaco(fluxo, SC)
    campoIC.textContent = IC
})