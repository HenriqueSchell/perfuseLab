


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
    const altura = Number(paciente.altura)

    //Resgatar e imprimir os dados
    const campoSexo = document.getElementById('campoSexo')
    const campoIdade = document.getElementById('campoIdade')
    const campoPeso = document.getElementById('campoPeso')
    const campoSC = document.getElementById('campoSC')

    campoSexo.textContent = `Paciente : ${paciente.sexo}`
    campoIdade.textContent = `${idade} anos`
    campoPeso.textContent = `${peso} Kg`

    //Calcular Superfície Corporal
    const SC = Math.sqrt((peso * altura) / 3600)

})