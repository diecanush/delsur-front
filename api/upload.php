<?php
$target_dir = "uploads/";
$target_file = $target_dir . basename($_FILES["url_imagen"]["name"]);
$uploadOk = 1;
$imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

// Check if image file is a actual image or fake image
if(isset($_POST["submit"])) {
    $check = getimagesize($_FILES["url_imagen"]["tmp_name"]);
    if($check !== false) {
        $uploadOk = 1;
    } else {
        echo json_encode(["error" => "File is not an image."]);
        $uploadOk = 0;
    }
}

// Check if file already exists
if (file_exists($target_file)) {
    echo json_encode(["error" => "Sorry, file already exists."]);
    $uploadOk = 0;
}

// Check file size
if ($_FILES["url_imagen"]["size"] > 500000) {
    echo json_encode(["error" => "Sorry, your file is too large."]);
    $uploadOk = 0;
}

// Allow certain file formats
if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg"
&& $imageFileType != "gif" ) {
    echo json_encode(["error" => "Sorry, only JPG, JPEG, PNG & GIF files are allowed."]);
    $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    echo json_encode(["error" => "Sorry, your file was not uploaded."]);
// if everything is ok, try to upload file
} else {
    if (move_uploaded_file($_FILES["url_imagen"]["tmp_name"], $target_file)) {
        echo json_encode(["success" => "The file ". basename( $_FILES["url_imagen"]["name"]). " has been uploaded.", "filename" => basename($_FILES["url_imagen"]["name"])]);
    } else {
        echo json_encode(["error" => "Sorry, there was an error uploading your file."]);
    }
}
?>
