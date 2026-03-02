package com.example.documind;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {

    @RequestMapping(value = "/{path:[^\\.]*}")  // cattura tutte le rotte che NON contengono un punto
    public String redirect() {
        return "forward:/index.html";  // inoltra solo per URL “pulite”
    }
}