document.addEventListener("DOMContentLoaded", function () {
    // Fetch tables and populate dropdown
    fetch("http://localhost/delsur/api/tables")
        .then(response => response.json())
        .then(data => {
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
        .catch(error => console.error("Error fetching tables:", error));

    // Add event listener for table selection
    document.getElementById("tableSelect").addEventListener("change", function () {
        const selectedTable = this.value;
        loadTableData(selectedTable);
    });

    // Function to load data for a selected table
    function loadTableData(tableName) {
        // Fetch data for the selected table
        fetch(`http://localhost/delsur/api/${tableName}`)
            .then(response => response.json())
            .then(data => {
                // Display data as cards
                displayTableData(data);

                // Fetch table structure for the selected table
                fetch(`http://localhost/delsur/api/${tableName}/table_structure`)
                    .then(response => response.json())
                    .then(tableStructure => {
                        // Create a form for adding a new record
                        createAddRecordForm(tableStructure);
                    })
                    .catch(error => console.error("Error fetching table structure:", error));

            })
            .catch(error => console.error("Error fetching table data:", error));
    }

    // Function to display data as cards
    function displayTableData(data) {
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
                cardText.textContent = `${key}: ${value}`;
                cardBody.appendChild(cardText);
            }

            card.appendChild(cardBody);
            cardsContainer.appendChild(card);
        });
    }

    // Function to create a form for adding a new record
    function createAddRecordForm(tableStructure) {
        //console.log("creando formulario")
        //console.log(tableStructure)
        const formContainer = document.getElementById("formContainer");
        formContainer.innerHTML = ""; // Clear previous content

        const form = document.createElement("form");
        //console.log(form);

        tableStructure.forEach(column => {
            if (column.primary_key == false){
                const input = createInputField(column);
                //console.log(input);
                form.appendChild(input);
            }
        });

        const submitButton = document.createElement("button");
        submitButton.type = "button";
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
        
        if (column.foreign_key !== null) {
            // Handle foreign key
            return createSelectField(column);
        } else {
            
                // Handle other column types
                const input = document.createElement("input");
                input.className = "form-control";
                input.name = column.nombre;
                input.placeholder = column.nombre;

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
                    // Handle other column types as needed
                    default:
                        input.type = "text";
                        break;
                }

                return input;
        }
    }
    

    // Function to create a select field for foreign key
    function createSelectField(column) {
        const select = document.createElement("select");
        select.className = "form-control";
        select.name = column.nombre;

        // Fetch data for the referenced table
        fetch(`http://localhost/delsur/api/${column.foreign_key.tabla_referenciada}`)
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
                    // Handle input element
                    formData[fieldName] = input.value;
                }
            }
        });

        const selectedTable = document.getElementById("tableSelect").value;

        // Send a POST request to add a new record
        fetch(`http://localhost/delsur/api/${selectedTable}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            // Reload data for the selected table after adding a new record
            loadTableData(selectedTable);
        })
        .catch(error => console.error("Error adding a new record:", error));
    }

});
