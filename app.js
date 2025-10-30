document.addEventListener("DOMContentLoaded", function () {
    // Declaramos la URL de la API en ámbito global para que otras funciones (como confirmDelete) la puedan usar
    window.url_api = "https://diecanush.com.ar/delsur/api";
  
    // Fetch tables and populate dropdown
    fetch(url_api + "/tables")
        .then(response => response.json())
        .then(data => {
            const formContainer = document.getElementById("formContainer");
            const tableSelect = document.getElementById("tableSelect");
            data.forEach(table => {
                const option = document.createElement("option");
                option.value = table;
                option.textContent = table;
                tableSelect.appendChild(option);
            });
            // Trigger data loading for the selected table
            loadTableData(tableSelect.value);
        })
        .catch(error => {
            alert("no se conecto:" + error);
            const formContainer = document.getElementById("formContainer");
            formContainer.innerHTML = "<p> no hay nada</p>" + error;
            console.error("Error fetching tables:", error);
        });
  
    // Add event listener for table selection
    document.getElementById("tableSelect").addEventListener("change", function () {
        const selectedTable = this.value;
        loadTableData(selectedTable);
    });
  
    // Function to load data for a selected table
    function loadTableData(tableName) {
        fetch(`${url_api}/${tableName}`)
            .then(response => response.json())
            .then(data => {
                fetch(`${url_api}/${tableName}/table_structure`)
                    .then(response => response.json())
                    .then(tableStructure => {
                        const fieldComments = {};
                        tableStructure.forEach(column => {
                            fieldComments[column.nombre] = column.comentario || column.nombre;
                        });
                        displayTableData(data, fieldComments);
                        createAddRecordForm(tableStructure);
                    })
                    .catch(error => console.error(JSON.stringify(error)));
            })
            .catch(error => console.error("Error fetching table data:", error));
    }
  
    // Function to display data as cards
    function displayTableData(data, fieldComments) {
        const cardsContainer = document.getElementById("cardsContainer");
        cardsContainer.innerHTML = "";
        cardsContainer.className = "row";
    
        data.forEach(record => {
            const col = document.createElement("div");
            col.className = "col-xl-4 col-sm-12 col-md-12";
            const card = document.createElement("div");
            card.className = "card h-100";
            const cardBody = document.createElement("div");
            cardBody.className = "card-body";
    
            for (const [key, value] of Object.entries(record)) {
                if (key === "url_imagen" && value) {
                    let urls;
                    try {
                        urls = JSON.parse(value);
                        if (!Array.isArray(urls)) {
                            urls = [value];
                        }
                    } catch (e) {
                        urls = [value];
                    }
                    
                    const sliderContainer = document.createElement("div");
                    sliderContainer.className = "position-relative overflow-hidden mx-auto";
                    sliderContainer.style.width = "100%";
                    sliderContainer.style.maxWidth = "400px";
    
                    const sliderImg = document.createElement("img");
                    sliderImg.src = urls[0];
                    sliderImg.alt = fieldComments[key] || key;
                    sliderImg.className = "img-fluid d-block";
                    sliderContainer.appendChild(sliderImg);
    
                    const prevButton = document.createElement("button");
                    prevButton.textContent = "<";
                    prevButton.className = "btn btn-secondary position-absolute";
                    prevButton.style.top = "50%";
                    prevButton.style.left = "10px";
                    prevButton.style.transform = "translateY(-50%)";
                    sliderContainer.appendChild(prevButton);
    
                    const nextButton = document.createElement("button");
                    nextButton.textContent = ">";
                    nextButton.className = "btn btn-secondary position-absolute";
                    nextButton.style.top = "50%";
                    nextButton.style.right = "10px";
                    nextButton.style.transform = "translateY(-50%)";
                    sliderContainer.appendChild(nextButton);
    
                    let currentIndex = 0;
                    prevButton.addEventListener("click", function() {
                        currentIndex = (currentIndex - 1 + urls.length) % urls.length;
                        sliderImg.src = urls[currentIndex];
                    });
                    nextButton.addEventListener("click", function() {
                        currentIndex = (currentIndex + 1) % urls.length;
                        sliderImg.src = urls[currentIndex];
                    });
    
                    cardBody.appendChild(sliderContainer);
                } else {
                    const cardText = document.createElement("p");
                    cardText.className = "card-text";
                    cardText.textContent = `${fieldComments[key]}: ${value}`;
                    cardBody.appendChild(cardText);
                }
            }
    
            card.appendChild(cardBody);
    
            const cardFooter = document.createElement("div");
            cardFooter.className = "card-footer d-flex justify-content-between";
    
            const editButton = document.createElement("button");
            editButton.innerText = "Editar";
            editButton.className = "btn btn-warning";
            editButton.addEventListener("click", () => editRecord(record));
            cardFooter.appendChild(editButton);
    
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Eliminar";
            deleteButton.className = "btn btn-danger";
            deleteButton.addEventListener("click", () => confirmDelete(record[Object.keys(record)[0]]));
            cardFooter.appendChild(deleteButton);
    
            card.appendChild(cardFooter);
            col.appendChild(card);
            cardsContainer.appendChild(col);
        });
    }
  
    // Function to populate the form to edit
    function editRecord(record) {
        for (const [key, value] of Object.entries(record)) {
            const campo = document.getElementById(key);
            if (campo !== null) {
                campo.value = value;
            }
        }
        let submitButton = document.getElementById('submitButton');
        if (submitButton && submitButton.parentNode) {
            submitButton.parentNode.removeChild(submitButton);
        }
        submitButton = document.createElement("button");
        submitButton.id = 'submitButton';
        submitButton.textContent = "Update Record";
        submitButton.className = "btn btn-warning";
    
        const form = document.getElementById("form");
        form.appendChild(submitButton);
        document.getElementById("submitButton").addEventListener("click", function (e) {
            updateRecord(e, record);
        });
    
        form.scrollIntoView();
    }
  
    // Function to create a form for adding a new record
    function createAddRecordForm(tableStructure) {
        const formContainer = document.getElementById("formContainer");
        formContainer.innerHTML = "";
    
        const form = document.createElement("form");
        form.id = "form";
    
        tableStructure.forEach(column => {
            if (column.primary_key == false) {
                const input = createInputField(column);
                form.appendChild(input);
            }
        });
    
        const submitButton = document.createElement("button");
        submitButton.type = "button";
        submitButton.id = "submitButton";
        submitButton.className = "btn btn-primary";
        submitButton.textContent = "Add Record";
        submitButton.addEventListener("click", function () {
            addNewRecord(tableStructure);
        });
    
        form.appendChild(submitButton);
        formContainer.appendChild(form);
    }
  
    // Function to create input fields based on column type
    function createInputField(column) {
        const fieldContainer = document.createElement("div");
        fieldContainer.className = "form-group";
    
        if (column.nombre === "url_imagen") {
            console.log("es una imagen");
            fieldContainer.appendChild(createUrlField(column));
        } else {
            if (column.foreign_key !== null) {
                fieldContainer.appendChild(createSelectField(column));
            } else {
                const input = document.createElement("input");
                input.className = "form-control";
                input.name = column.nombre;
                input.id = column.nombre;
                input.placeholder = column.comentario || column.nombre;
    
                switch (column.tipo.toLowerCase()) {
                    case "int":
                    case "int(11)":
                    case "bigint":
                    case "smallint":
                    case "tinyint":
                    case "double":
                        input.type = "number";
                        break;
                    case "text":
                    case "varchar":
                    case "char":
                        input.type = "text";
                        break;
                    case "date":
                        input.type = "date";
                        break;
                    default:
                        input.type = "text";
                        break;
                }
    
                fieldContainer.appendChild(input);
            }
        }
    
        return fieldContainer;
    }
  
    // Function to create a select field for foreign key
    function createSelectField(column) {
        const select = document.createElement("select");
        select.className = "form-control";
        select.name = column.nombre;
        select.id = column.nombre;
        select.placeholder = column.nombre;
    
        fetch(`${url_api}/${column.foreign_key.tabla_referenciada}`)
            .then(response => response.json())
            .then(data => {
                data.forEach(record => {
                    const option = document.createElement("option");
                    option.value = record[column.foreign_key.campo_referenciado];
                    option.textContent = record[Object.keys(record)[1]];
                    select.appendChild(option);
                });
            })
            .catch(error => console.error(`Error fetching data for ${column.foreign_key.tabla_referenciada}:`, error));
    
        return select;
    }
  
   // Función para crear el file input para imágenes con funcionalidad de recorte (procesamiento secuencial)
function createUrlField(column) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "form-control";
    fileInput.name = column.nombre + "[]";
    fileInput.placeholder = column.nombre;
    fileInput.multiple = true;
    fileInput.accept = "image/*";
  
    // Almacena los archivos recortados aquí
    fileInput.croppedFiles = [];
  
    fileInput.addEventListener("change", function (event) {
        const files = event.target.files;
        fileInput.croppedFiles = [];
        if (files.length > 0) {
            let index = 0;
            function processNext() {
                if (index < files.length) {
                    openCropModal(files[index], function (croppedFile) {
                        fileInput.croppedFiles.push(croppedFile);
                        index++;
                        processNext();
                    });
                } else {
                    console.log("Todos los archivos recortados:", fileInput.croppedFiles);
                }
            }
            processNext();
        }
    });
  
    return fileInput;
}


   // Función para abrir el modal de recorte usando Cropper.js
    // Recibe el archivo y un callback que se ejecuta con el archivo recortado (File)
    function openCropModal(file, callback) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const image = document.getElementById("imageToCrop");
        image.src = event.target.result;
        
        // Si existe un cropper previo, lo destruimos
        if (window.cropper) {
          window.cropper.destroy();
          window.cropper = null;
        }
        // Limpia cualquier handler previo en el modal y en el botón
        $('#cropModal').off('shown.bs.modal');
        $('#cropButton').off('click');
        $('#cropModal').off('hidden.bs.modal');
        
        // Muestra el modal
        $("#cropModal").modal("show");
        
        // Cuando se muestra el modal, inicializa Cropper
        $('#cropModal').one('shown.bs.modal', function () {
          window.cropper = new Cropper(image, {
            aspectRatio: 1, // 1:1 ideal para Instagram
            viewMode: 1,
          });
        });
        
        // Configura el botón "Recortar"
        $('#cropButton').one('click', function () {
          if (window.cropper) {
            const canvas = window.cropper.getCroppedCanvas({
              width: 1080,
              height: 1080,
            });
            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            window.cropper.destroy();
            window.cropper = null;
            document.getElementById("cropButton").blur();

            $("#cropModal").modal("hide");
            // Una vez oculto el modal, se llama al callback con el archivo recortado
            $('#cropModal').one('hidden.bs.modal', function () {
              const croppedFile = dataURLtoFile(croppedDataUrl, file.name);
              callback(croppedFile);
            });
          }
        });
      };
      reader.readAsDataURL(file);
    }
      
    // Función para convertir un DataURL a un objeto File
    function dataURLtoFile(dataUrl, filename) {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    }

  
   // Function to add a new record using FormData
    function addNewRecord(tableStructure) {
        const formElement = document.getElementById("form");
        const selectedTable = document.getElementById("tableSelect").value;
        const formData = new FormData();
    
        Array.from(formElement.elements).forEach(element => {
            if (element.type === "file") {
                // Solo se agrega si se seleccionaron archivos o se recortaron
                if ((element.files && element.files.length > 0) || 
                    (element.croppedFiles && element.croppedFiles.length > 0)) {
                    if (element.croppedFiles && element.croppedFiles.length > 0) {
                        for (const file of element.croppedFiles) {
                            formData.append(element.name, file);
                        }
                    } else {
                        for (const file of element.files) {
                            formData.append(element.name, file);
                        }
                    }
                }
            } else if (element.name) {
                // Si deseas evitar campos vacíos, puedes validar que no estén en blanco
                if (element.value !== undefined && element.value !== null && element.value.trim() !== "") {
                    formData.append(element.name, element.value);
                }
            }
        });
        
        formData.forEach((value, key) => {
            console.log(key, value);
        });
    
        fetch(`${url_api}/${selectedTable}`, {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta POST:", data);
            loadTableData(selectedTable);
        })
        .catch(error => console.error("Error adding a new record:", error));
    }


  
    async function updateRecord(event, record) {
        event.preventDefault();
        const selectedTable = document.getElementById("tableSelect").value;
        const id = record[Object.keys(record)[0]];
        const formElement = document.getElementById("form");
        const formData = new FormData();
    
        Array.from(formElement.elements).forEach(element => {
            if (element.type === "file") {
                if (element.croppedFiles && element.croppedFiles.length > 0) {
                    for (const file of element.croppedFiles) {
                        formData.append(element.name, file);
                    }
                } else {
                    for (const file of element.files) {
                        formData.append(element.name, file);
                    }
                }
            } else if (element.name) {
                formData.append(element.name, element.value);
            }
        });
    
        try {
            const response = await fetch(`${url_api}/${selectedTable}/${id}`, {
                method: "POST",
                headers: {
                    "X-HTTP-Method-Override": "PUT"
                },
                body: formData
            });
            const data = await response.json();
            console.log("Respuesta PUT:", data);
            loadTableData(selectedTable);
        } catch (error) {
            console.error("Error updating record:", error);
        }
    }
  
    // FIN de las modificaciones que usan FormData
});
  
// Function to delete after confirm
function confirmDelete(id) {
    const selectedTable = document.getElementById("tableSelect").value;
    if (confirm("Está seguro que dese eliminar el registro " + id + "?")) {
        fetch(`${url_api}/${selectedTable}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: ''
        })
            .then(data => {
                loadTableData(selectedTable);
            })
            .catch(error => {
                console.error("No se pudo eliminar", JSON.stringify(error));
                loadTableData(selectedTable);
            });
    }
}
