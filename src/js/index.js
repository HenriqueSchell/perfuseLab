const btnMain = document.getElementById('btnMain')
const btnModal = document.getElementById('btnModal')
const btnClose = document.getElementById('btnClose')
const main = document.getElementById('main')
const modal = document.getElementById('modal')

//dados validações
const errorSex = document.getElementById('errorSex')


btnMain.addEventListener('click', () => {
    main.classList.add('hidden')
    modal.classList.remove('hidden')
})

btnClose.addEventListener('click', () => {
    main.classList.remove('hidden')
    modal.classList.add('hidden')
})

btnModal.addEventListener('click', () => {
    const sexo = document.getElementById('sexo').value.toLowerCase()
    const idade = document.getElementById('idade').value
    const peso = document.getElementById('peso').value
    const altura = document.getElementById('altura').value
    const hemoglobina = document.getElementById('hemoglobina').value
    const hematocrito = document.getElementById('hematocrito').value
    const fluxo = document.getElementById('fluxo').value
    const temperatura = document.getElementById('temperatura').value
    const pam = document.getElementById('pam').value
    const lactato = document.getElementById('lactato').value

    
    //validações
    if(!['masculino', 'feminino'].includes(sexo)){
        errorSex.classList.remove('hidden')
    }else{
        errorSex.classList.add('hidden')
    }

    const alturaNum = Number(altura)
    if(!Number.isInteger(alturaNum)){
        alert('A altura deve ser informada em centímetros!')
        return
    }
    
    const campos = [idade, peso, altura, hemoglobina, hematocrito, fluxo, temperatura, pam, lactato]
    if (campos.some(campo => campo === '' || campo === null || isNaN(campo))) {
        alert('Preencha os dados corretamente!')
        return
    }
    
    const paciente = {
            sexo,
            idade,
            peso,
            alturaNum,
            hemoglobina,
            hematocrito,
            fluxo,
            temperatura,
            pam,
            lactato
        }
    localStorage.setItem('paciente', JSON.stringify(paciente))
    window.location.href = 'dashboard.html'
    })

