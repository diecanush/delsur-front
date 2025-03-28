document.addEventListener("DOMContentLoaded", function () {
    // Fetch tables and populate dropdown
    fetch("http://diecanush.com.ar/delsur/api/tables")
        .then(response => response.json())
        .then(data => {
             const formContainer = document.getElementById("formContainer")
            //formContainer.innerHTML = "<p>hay algo</p>"
            //alert("datos encontrados")
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
        fetch(`http://diecanush.com.ar/delsur/api/${tableName}`)
            .then(response => response.json())
            .then(data => {
                // Fetch table structure for the selected table
                fetch(`http://diecanush.com.ar/delsur/api/${tableName}/table_structure`)
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
                const cardText = document.createElement("p");
                cardText.textContent = `${fieldComments[key]}: ${value}`; // Use comentario instead of field name
                cardBody.appendChild(cardText);
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
        //console.log(record);
        for (const [key, value] of Object.entries(record)){
            //console.log(key,value);
            const campo = document.getElementById(key);
            if (campo !== null){
                campo.value = value;
            }
        }
        let submitButton = document.getElementById('submitButton');
        //console.log(submitButton);
        
        if (submitButton.parentNode) {
            submitButton.parentNode.removeChild(submitButton);
        }
        submitButton = document.createElement("button");
        submitButton.id = 'submitButton'
        submitButton.textContent = "Update Record";
        submitButton.className = "btn btn-warning";
        submitButton.addEventListener("click", function () {
            //alert("está por modificar");
            updateRecord(record);
        })
        form = document.getElementById("form");
        form.appendChild(submitButton);
        
        
        form.scrollIntoView();
        

    }

    // Function to create a form for adding a new record
    function createAddRecordForm(tableStructure) {
        //console.log("creando formulario")
        //console.log(tableStructure)
        const formContainer = document.getElementById("formContainer");
        formContainer.innerHTML = ""; // Clear previous content

        const form = document.createElement("form");
        //console.log(form);
        form.id = "form";

        tableStructure.forEach(column => {
            if (column.primary_key == false){
                const input = createInputField(column);
                //console.log(input);
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
        //console.log(column);
    
        const fieldContainer = document.createElement("div");
        fieldContainer.className = "form-group";
    
        /*const label = document.createElement("label");
        label.htmlFor = column.nombre;
        label.textContent = column.comentario || column.nombre; // Use "comentario" as caption if available
        fieldContainer.appendChild(label);*/
    
        if (column.nombre === "url_imagen") {
            console.log("es una imagen");
            fieldContainer.appendChild(createUrlField(column));
        } else {
            if (column.foreign_key !== null) {
                // Handle foreign key
                fieldContainer.appendChild(createSelectField(column));
            } else {
                // Handle other column types
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
                    case "boolean":
                        input.type = "checkbox";
                        break;
                    // Handle other column types as needed
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
        fetch(`http://diecanush.com.ar/delsur/api/${column.foreign_key.tabla_referenciada}`)
            .then(response => response.json())
            .then(data => {
                // Populate options with data from the referenced table
                data.forEach(record => {
                    const option = document.createElement("option");
                    option.value = record[column.foreign_key.campo_referenciado];
                    //console.log(Object.keys(record));
                    option.textContent = record[Object.keys(record)[1]];
                    select.appendChild(option);
                });
            })
            .catch(error => console.error(`Error fetching data for ${column.foreign_key.tabla_referenciada}:`, error));

        return select;
    }

    // Function to create file load button
    function createUrlField(column){
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.className = "form-control";
        fileInput.name = column.nombre;
        fileInput.placeholder = column.nombre;
        return fileInput;
    }
    
    // Function to add a new record
    function addNewRecord(tableStructure) {
        const formData = {};

        tableStructure.forEach(column => {
            const fieldName = column.nombre;
            const input = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
            
            if (input) {
                // Handle input and select elements
                if (input.tagName.toLowerCase() === 'select') {
                    // Handle select element
                    formData[fieldName] = input.options[input.selectedIndex].value;
                } else {
                    if (fieldName === 'url_imagen'){
                        formData[fieldName] = imageLoad(input.value);
                    } else {
                        // Handle input element
                        formData[fieldName] = input.value;
                    }
                }
            }
        });

        const selectedTable = document.getElementById("tableSelect").value;

        // Send a POST request to add a new record
        fetch(`http://diecanush.com.ar/delsur/api/${selectedTable}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
        .then(response => console.log(response.json()))
        .then(data => {
            // Reload data for the selected table after adding a new record
            loadTableData(selectedTable);
        })
        .catch(error => console.error("Error adding a new record:", error));
    }
    
    //function to update Record
    function updateRecord(record){
        const selectedTable = document.getElementById("tableSelect").value;
        const id = record[Object.keys(record)[0]];
        //console.log(id);
        delete record[Object.keys(record)[0]];
        //alert(`http://localhost/delsur/api/${selectedTable}/${id}`);
        
        let datos = {};
        Object.keys(record).forEach(campo => {
            const input = document.querySelector(`input[name="${campo}"], select[name="${campo}"]`);
            
            if (input) {
                // Handle input and select elements
                if (input.tagName.toLowerCase() === 'select') {
                    // Handle select element
                    datos[campo] = input.options[input.selectedIndex].value;
                } else {
                    // Handle input element
                    datos[campo] = input.value;
                }
            }
        })
        //alert(JSON.stringify(datos));
        // Send a PUT request to update record
        fetch(`http://diecanush.com.ar/delsur/api/${selectedTable}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        })
        .then(response => alert(JSON.stringify(response)))
        .then(data => {
            // Reload data for the selected table after adding a new record
            loadTableData(selectedTable);
        })
        .catch(error => console.log(JSON.stringify(error)));
    }

});

//Function to delete after confirm
function confirmDelete(id){
    const selectedTable = document.getElementById("tableSelect").value;
    if (confirm("Está seguro que dese eliminar el registro " + id + "?")){
        //console.log(id);
        fetch(`http://diecanush.com.ar/delsur/api/${selectedTable}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: ''
       })
        .then(data => {
            // Reload data for the selected table after delete record
            loadTableData(selectedTable);
        })
        .catch(error => {
            console.error("no se pudo eliminar",JSON.stringify(error));
            loadTableData(selectedTable);
        });
    }
}

function imageLoad(imageFile) {
    resizeImage(imageFile, 1024, 1024, function(resizedDataUrl) {
      // Aquí tienes la imagen redimensionada en resizedDataUrl (base64)
      console.log("Imagen redimensionada:", resizedDataUrl);
      // Enviar resizedDataUrl en el formulario o asignarlo a un campo oculto
    });
  }
  
  function resizeImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        let width = img.width;
        let height = img.height;
        
        // Calcula el ratio para mantener la relación de aspecto
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Crea un canvas para dibujar la imagen redimensionada
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convierte el canvas a DataURL (puedes ajustar la calidad)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        callback(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
      
