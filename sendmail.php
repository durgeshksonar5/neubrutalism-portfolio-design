<?php
/**
 * Contact Form Backend for Neubrutalism Portfolio
 * Handles form validation, sanitization, and sending via PHP mail()
 */

header('Content-Type: application/json');

// Error reporting for debugging (helpful for the user to see what's wrong)
error_reporting(E_ALL);
ini_set('display_errors', 0);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Collect and Sanitize Inputs
    $name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : 'Anonymous';
    $email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
    $projectType = isset($_POST['project-type']) ? strip_tags(trim($_POST['project-type'])) : 'Not Specified';
    $message = isset($_POST['message']) ? htmlspecialchars(trim($_POST['message'])) : '';

    // 2. Validation
    if (empty($name) || empty($email) || empty($message)) {
        echo json_encode(["success" => false, "message" => "Please fill in all required fields (Name, Email, and Message)."]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "The email address provided is invalid."]);
        exit;
    }

    // 3. Email Configuration
    $to = "shriparthc05@gmail.com";
    $subject = "PORTFOLIO: New Lead from " . $name;
    
    // 4. Email Body (HTML)
    $email_body = "
    <div style='font-family: sans-serif; padding: 20px; background: #f4f4f4;'>
        <div style='background: #fff; padding: 30px; border: 3px solid #000; box-shadow: 10px 10px 0px #FFD700;'>
            <h2 style='margin-top: 0; border-bottom: 2px solid #000; padding-bottom: 10px;'>New Project Inquiry</h2>
            <p><strong>From:</strong> {$name} ({$email})</p>
            <p><strong>Project Type:</strong> <span style='background: #000; color: #fff; padding: 2px 8px;'>{$projectType}</span></p>
            <hr style='border: 1px solid #eee; margin: 20px 0;'>
            <p><strong>Message:</strong></p>
            <p style='white-space: pre-wrap; background: #fafafa; padding: 15px; border-left: 4px solid #000;'>{$message}</p>
        </div>
    </div>
    ";

    // 5. Headers - Using a generic sender to improve deliverability
    $host = $_SERVER['HTTP_HOST'];
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Portfolio Website <noreply@{$host}>" . "\r\n";
    $headers .= "Reply-To: {$email}" . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // 6. Send Mail
    if (mail($to, $subject, $email_body, $headers)) {
        echo json_encode(["success" => true, "message" => "Your message has been sent successfully!"]);
    } else {
        // Mail function failed
        $error = error_get_last();
        echo json_encode([
            "success" => false, 
            "message" => "Server failed to send email. If you are on a local machine (XAMPP), mail() is usually disabled by default. Please check your server's SMTP settings.",
            "debug" => $error ? $error['message'] : 'Unknown error'
        ]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method. Access denied."]);
}
?>
