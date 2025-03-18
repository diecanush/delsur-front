document.addEventListener("DOMContentLoaded", function () {
    // Fetch tables and populate dropdown
    let url_api = "http://diecanush.com.ar/delsur/api";
    fetch(url_api+"/tables")
        .then(response => response.json())
        .then(data => {
            const formContainer = document.getElementById("formContainer")
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
            alert("no se conecto:" + error)
            const formContainer = document.getElementById("formContainer")
            formContainer.innerHTML = "<p> no hay nada</p>" + error
            console.error("Error fetching tables:", error)
        });

    // Add event listener for table selection
    document.getElementById("tableSelect").addEventListener("change", function () {
        const selectedTable = this.value;
        loadTableData(selectedTable);
    });

    // Function to load data for a selected table
    function loadTableData(tableName) {
        // Fetch data for the selected table
        fetch(`${url_api}/${tableName}`)
            .then(response => response.json())
            .then(data => {
                // Fetch table structure for the selected table
                fetch(`${url_api}/${tableName}/table_structure`)
                    .then(response => response.json())
                    .then(tableStructure => {
                        // Create a map of field names to comentarios
                        const fieldComments = {};
                        tableStructure.forEach(column => {
                            fieldComments[column.nombre] = column.comentario || column.nombre;
                        });

                        // Display data as cards
                        displayTableData(data, fieldComments);

                        // Create a form for adding a new record
                        createAddRecordForm(tableStructure);
                    })
                    .catch(error => console.error(JSON.stringify(error)));
            })
            .catch(error => console.error("Error fetching table data:", error));
    }

    // Function to display data as cards
    function displayTableData(data, fieldComments) {
        const cardsContainer = document.getElementById("cardsContainer");
        cardsContainer.innerHTML = ""; // Clear previous content

        data.forEach(record => {
            const card = document.createElement("div");
            card.className = "col-md-4 mb-4 border";

            const cardBody = document.createElement("div");
            cardBody.className = "card-body";

            // Iterate through record properties and display them
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
                    
                    // Crear un contenedor para el slider
                    const sliderContainer = document.createElement("div");
                    sliderContainer.style.position = "relative";
                    sliderContainer.style.overflow = "hidden";
                    sliderContainer.style.width = "100%";
                    sliderContainer.style.maxWidth = "400px"; // Ajusta este valor según tu diseño
                    sliderContainer.style.margin = "0 auto";
                    
                    // Crear el elemento de imagen que se mostrará
                    const sliderImg = document.createElement("img");
                    sliderImg.src = urls[0];
                    sliderImg.alt = fieldComments[key] || key;
                    sliderImg.style.width = "100%";
                    sliderImg.style.display = "block";
                    sliderContainer.appendChild(sliderImg);
                    
                    // Crear botón "anterior"
                    const prevButton = document.createElement("button");
                    prevButton.textContent = "<";
                    prevButton.style.position = "absolute";
                    prevButton.style.top = "50%";
                    prevButton.style.left = "10px";
                    prevButton.style.transform = "translateY(-50%)";
                    sliderContainer.appendChild(prevButton);
                    
                    // Crear botón "siguiente"
                    const nextButton = document.createElement("button");
                    nextButton.textContent = ">";
                    nextButton.style.position = "absolute";
                    nextButton.style.top = "50%";
                    nextButton.style.right = "10px";
                    nextButton.style.transform = "translateY(-50%)";
                    sliderContainer.appendChild(nextButton);
                    
                    // Variable para controlar el índice de la imagen actual
                    let currentIndex = 0;
                    
                    prevButton.addEventListener("click", function() {
                        currentIndex = (currentIndex - 1 + urls.length) % urls.length;
                        sliderImg.src = urls[currentIndex];
                    });
                    
                    nextButton.addEventListener("click", function() {
                        currentIndex = (currentIndex + 1) % urls.length;
                        sliderImg.src = urls[currentIndex];
                    });
                    
                    // Agregar el slider al contenedor de la tarjeta
                    cardBody.appendChild(sliderContainer);
                }else {
                    // Mostrar otros campos como texto
                    const cardText = document.createElement("p");
                    cardText.textContent = `${fieldComments[key]}: ${value}`;
                    cardBody.appendChild(cardText);
                }
            }

            card.appendChild(cardBody);

            // Botón para editar
            const editButton = document.createElement("button");
            editButton.innerText = "Editar";
            editButton.className = "btn btn-warning";
            editButton.addEventListener("click", () => editRecord(record)); // Llamada a la función de edición
            card.appendChild(editButton);

            // Botón para eliminar
            const deleteButton = document.createElement("button");
            deleteButton.className = "btn btn-danger";
            deleteButton.innerText = "Eliminar";
            deleteButton.addEventListener("click", () => confirmDelete(record[Object.keys(record)[0]])); // Llamada a la función de eliminación
            card.appendChild(deleteButton);

            cardsContainer.appendChild(card);
        });
    }

    //Function to populate the form to edit
    function editRecord(record){
        for (const [key, value] of Object.entries(record)){
            const campo = document.getElementById(key);
            if (campo !== null){
                campo.value = value;
            }
        }
        let submitButton = document.getElementById('submitButton');
        if (submitButton.parentNode) {
            submitButton.parentNode.removeChild(submitButton);
        }
        submitButton = document.createElement("button");
        submitButton.id = 'submitButton'
        submitButton.textContent = "Update Record";
        submitButton.className = "btn btn-warning";
        submitButton.addEventListener("click", function () {
            updateRecord(record);
        })
        const form = document.getElementById("form");
        form.appendChild(submitButton);
        
        form.scrollIntoView();
    }

    // Function to create a form for adding a new record
    function createAddRecordForm(tableStructure) {
        const formContainer = document.getElementById("formContainer");
        formContainer.innerHTML = ""; // Clear previous content

        const form = document.createElement("form");
        form.id = "form";

        tableStructure.forEach(column => {
            if (column.primary_key == false){
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
                // Handle foreign key
                fieldContainer.appendChild(createSelectField(column));
            } else {
                const input = document.createElement("input");
                input.className = "form-control";
                input.name = column.nombre;
                input.id = column.nombre;
                input.placeholder = column.comentario || column.nombre;
    
                // Adjust input type based on column type
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

        // Fetch data for the referenced table
        fetch(`${url_api}/${column.foreign_key.tabla_referenciada}`)
            .then(response => response.json())
            .then(data => {
                // Populate options with data from the referenced table
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

    // Function to create file input for images
    function createUrlField(column){
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.className = "form-control";
        // Asigna el nombre como array, por ejemplo "url_imagen[]" en vez de "url_imagen"
        fileInput.name = column.nombre + "[]";
        fileInput.placeholder = column.nombre;
        fileInput.multiple = true; // Permite seleccionar varios archivos
        return fileInput;
    }
    
    // MODIFICACIONES: Usar FormData en lugar de base64

    // Function to add a new record usando FormData
    function addNewRecord(tableStructure) {
        // Se asume que el formulario con id "form" contiene todos los inputs, incluido el file
        const formElement = document.getElementById("form");
        const formData = new FormData(formElement);
        const selectedTable = document.getElementById("tableSelect").value;
    
        fetch(`${url_api}/${selectedTable}`, {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta POST:", data);
            // Recargar datos de la tabla seleccionada después de agregar el registro
            loadTableData(selectedTable);
        })
        .catch(error => console.error("Error adding a new record:", error));
    }
    
    // Function to update a record using FormData
    function updateRecord(record){
        const selectedTable = document.getElementById("tableSelect").value;
        const id = record[Object.keys(record)[0]];
        const formElement = document.getElementById("form");
        const formData = new FormData(formElement);
    
        fetch(`${url_api}/${selectedTable}/${id}`, {
            method: "POST", // Se usa POST en lugar de PUT
            headers: {
                "X-HTTP-Method-Override": "PUT" // Se indica que es PUT
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta PUT:", data);
            // Recargar datos de la tabla seleccionada después de actualizar el registro
            loadTableData(selectedTable);
        })
        .catch(error => console.error("Error updating record:", error));
    }
    
    
    // FIN de las modificaciones que usan FormData

});

// Function to delete after confirm
function confirmDelete(id){
    const selectedTable = document.getElementById("tableSelect").value;
    if (confirm("Está seguro que dese eliminar el registro " + id + "?")){
        fetch(`${url_api}/${selectedTable}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: ''
       })
        .then(data => {
            // Recargar datos para la tabla seleccionada después de eliminar el registro
            loadTableData(selectedTable);
        })
        .catch(error => {
            console.error("No se pudo eliminar", JSON.stringify(error));
            loadTableData(selectedTable);
        });
    }
}

// Se elimina la función imageLoad ya que no se necesita al usar FormData
